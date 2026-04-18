export namespace main {
	
	export class EmailHistory {
	    id: string;
	    from: string;
	    to: string[];
	    subject: string;
	    // Go type: time
	    sentAt: any;
	    status: string;
	    resendId?: string;
	
	    static createFrom(source: any = {}) {
	        return new EmailHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.from = source["from"];
	        this.to = source["to"];
	        this.subject = source["subject"];
	        this.sentAt = this.convertValues(source["sentAt"], null);
	        this.status = source["status"];
	        this.resendId = source["resendId"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

