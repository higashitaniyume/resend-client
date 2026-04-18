package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx        context.Context
	configPath string
	encKey     []byte
}

// EmailRequest represents an email to send
type EmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

// EmailHistory represents a sent email record
type EmailHistory struct {
	ID       string    `json:"id"`
	From     string    `json:"from"`
	To       []string  `json:"to"`
	Subject  string    `json:"subject"`
	SentAt   time.Time `json:"sentAt"`
	Status   string    `json:"status"`
	ResendID string    `json:"resendId,omitempty"`
}

// Config stores encrypted user data
type Config struct {
	APIKey  string         `json:"apiKey"`
	History []EmailHistory `json:"history"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".resend-client")
	os.MkdirAll(configPath, 0700)

	// Generate a simple encryption key (in production, use a more secure method)
	encKey := []byte("resend-client-32-byte-key!!!!!!!")

	return &App{
		configPath: configPath,
		encKey:     encKey,
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SaveAPIKey saves the API key securely
func (a *App) SaveAPIKey(apiKey string) error {
	config, _ := a.loadConfig()
	config.APIKey = apiKey
	return a.saveConfig(config)
}

// GetAPIKey retrieves the stored API key
func (a *App) GetAPIKey() (string, error) {
	config, err := a.loadConfig()
	if err != nil {
		return "", err
	}
	return config.APIKey, nil
}

// SendEmail sends an email via Resend API
func (a *App) SendEmail(from string, to []string, subject string, html string, text string) (string, error) {
	apiKey, err := a.GetAPIKey()
	if err != nil || apiKey == "" {
		return "", errors.New("API key not configured")
	}

	// Prepare request
	reqBody := map[string]interface{}{
		"from":    from,
		"to":      to,
		"subject": subject,
	}

	if html != "" {
		reqBody["html"] = html
	}
	if text != "" {
		reqBody["text"] = text
	}

	jsonData, _ := json.Marshal(reqBody)

	// Send request to Resend API
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", strings.NewReader(string(jsonData)))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("failed to send email: %s", string(body))
	}

	// Parse response
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	resendID := ""
	if id, ok := result["id"].(string); ok {
		resendID = id
	}

	// Save to history
	history := EmailHistory{
		ID:       fmt.Sprintf("%d", time.Now().Unix()),
		From:     from,
		To:       to,
		Subject:  subject,
		SentAt:   time.Now(),
		Status:   "sent",
		ResendID: resendID,
	}

	a.addHistory(history)

	return resendID, nil
}

// GetHistory retrieves email history
func (a *App) GetHistory() ([]EmailHistory, error) {
	config, err := a.loadConfig()
	if err != nil {
		return []EmailHistory{}, nil
	}
	return config.History, nil
}

// ClearHistory clears all email history
func (a *App) ClearHistory() error {
	config, _ := a.loadConfig()
	config.History = []EmailHistory{}
	return a.saveConfig(config)
}

// Helper functions
func (a *App) loadConfig() (*Config, error) {
	configFile := filepath.Join(a.configPath, "config.enc")
	data, err := os.ReadFile(configFile)
	if err != nil {
		return &Config{History: []EmailHistory{}}, nil
	}

	decrypted, err := a.decrypt(data)
	if err != nil {
		return &Config{History: []EmailHistory{}}, err
	}

	var config Config
	err = json.Unmarshal(decrypted, &config)
	if err != nil {
		return &Config{History: []EmailHistory{}}, err
	}

	return &config, nil
}

func (a *App) saveConfig(config *Config) error {
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}

	encrypted, err := a.encrypt(data)
	if err != nil {
		return err
	}

	configFile := filepath.Join(a.configPath, "config.enc")
	return os.WriteFile(configFile, encrypted, 0600)
}

func (a *App) addHistory(history EmailHistory) error {
	config, _ := a.loadConfig()
	config.History = append([]EmailHistory{history}, config.History...)

	// Keep only last 100 emails
	if len(config.History) > 100 {
		config.History = config.History[:100]
	}

	return a.saveConfig(config)
}

func (a *App) encrypt(data []byte) ([]byte, error) {
	block, err := aes.NewCipher(a.encKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, data, nil)
	return []byte(base64.StdEncoding.EncodeToString(ciphertext)), nil
}

func (a *App) decrypt(data []byte) ([]byte, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(a.encKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}
