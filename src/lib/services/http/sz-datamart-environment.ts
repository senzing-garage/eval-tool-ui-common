export interface SzDataMartEnvironmentParameters {
    apiKeys?: {[ key: string ]: string};
    username?: string;
    password?: string;
    accessToken?: string | (() => string);
    basePath?: string;
    withCredentials?: boolean;
    additionalHeaders?: {[key: string]: string};
}

export class SzDataMartEnvironment {
    apiKeys?: {[ key: string ]: string};
    username?: string;
    password?: string;
    accessToken?: string | (() => string);
    basePath?: string;
    withCredentials?: boolean;
    /** 
     * additional headers to pass to api requests 
     * @internal
    */
    private _additionalHeaders: {key: string, value: string}[] | undefined;

    constructor(configurationParameters: SzDataMartEnvironmentParameters = {}) {
        this.apiKeys = configurationParameters.apiKeys;
        this.username = configurationParameters.username;
        this.password = configurationParameters.password;
        this.accessToken = configurationParameters.accessToken;
        this.basePath = configurationParameters.basePath;
        this.withCredentials = configurationParameters.withCredentials;
        // safety check because extra setter logic to unset value present
        if(configurationParameters.additionalHeaders) { 
            this.additionalHeaders = configurationParameters.additionalHeaders;
        }
    }

    /**
     * Convenience getter that returns the current state of the object's 
     * properties as a <SzDataMartEnvironmentParameters> Object
     */
    public get configurationParameters(): SzDataMartEnvironmentParameters {
        let retVal: SzDataMartEnvironmentParameters = {};
        if(this.apiKeys && this.apiKeys !== undefined && this.apiKeys !== null) retVal.apiKeys = this.apiKeys; 
        if(this.username && this.username !== undefined && this.username !== null) retVal.username = this.username; 
        if(this.password && this.password !== undefined && this.password !== null) retVal.password = this.password; 
        if(this.accessToken && this.accessToken !== undefined && this.accessToken !== null) retVal.accessToken = this.accessToken; 
        if(this.basePath && this.basePath !== undefined && this.basePath !== null) retVal.basePath = this.basePath; 
        if(this.withCredentials && this.withCredentials !== undefined && this.withCredentials !== null) retVal.withCredentials = this.withCredentials; 
        if(this.additionalHeaders && this.additionalHeaders !== undefined && this.additionalHeaders !== null) retVal.additionalHeaders = this.additionalHeaders; 
        return retVal;
    }
    /**
     * set the object's properties through a <SzDataMartEnvironmentParameters> Object
     */
    public set configurationParameters(value: SzDataMartEnvironmentParameters) {
        let retVal: SzDataMartEnvironmentParameters = {};
        if(value.apiKeys && value.apiKeys !== undefined && value.apiKeys !== null) this.apiKeys = value.apiKeys; 
        if(value.username && value.username !== undefined && value.username !== null) this.username = value.username; 
        if(value.password && value.password !== undefined && value.password !== null) this.password = value.password; 
        if(value.accessToken && value.accessToken !== undefined && value.accessToken !== null) this.accessToken = value.accessToken; 
        if(value.basePath && value.basePath !== undefined && value.basePath !== null) this.basePath = value.basePath; 
        if(value.withCredentials && value.withCredentials !== undefined && value.withCredentials !== null) this.withCredentials = value.withCredentials; 
        if(value.additionalHeaders && value.additionalHeaders !== undefined && value.additionalHeaders !== null) this.additionalHeaders = value.additionalHeaders; 
    }

    /**
     * Select the correct content-type to use for a request.
     * Uses {@link Configuration#isJsonMime} to determine the correct content-type.
     * If no content type is found return the first found type if the contentTypes is not empty
     * @param contentTypes - the array of content types that are available for selection
     * @returns the selected content-type or <code>undefined</code> if no selection could be made.
     */
    public selectHeaderContentType (contentTypes: string[], body?: string | Blob | File | Array<{ [key: string]: any; }>): string | undefined {
        if (body) {
            return this.getMimeTypeFromBody(body);
        }
        if (contentTypes.length == 0) {
            return undefined;
        }

        let type = contentTypes.find(x => this.isJsonMime(x));
        if (type === undefined) {
            return contentTypes[0];
        }
        return type;
    }

    /**
     * Attempts to return the valid mime-type based on the type of content detected from the body param.
     * @param body - the content to try and detect mime-type from
     * @returns the mime-type of the content to return or undefined if it could not be detected.
     */
    getMimeTypeFromBody(body?: string | Blob | File | Array<{ [key: string]: any; }>): string | undefined {
        if (body) {
            if((body as File).type || (body as File).name) {
                // is file
                let retVal = (body as File).type !== '' ? (body as File).type : 'text/plain';
                switch( retVal ) {
                    case 'application/vnd.ms-excel':
                        if( (body as File).name && (body as File).name.toUpperCase().indexOf('.CSV') > 1) {
                            // force text/csv since windows is dumb
                            retVal = 'text/csv';
                        }
                        break;
                    case 'application/vnd.ms-excel charset=UTF-8':
                        if( (body as File).name && (body as File).name.toUpperCase().indexOf('.CSV') > 1) {
                            // force text/csv since windows is dumb
                            retVal = 'text/csv charset=UTF-8';
                        }
                        break;
                    case 'application/json':
                        break;
                    case 'x-jsonlines':
                        break;
                    default:
                        if((body as File).type === '' && (body as File).name !== '' && (body as File).name.indexOf('.') > 0) {
                            // has extenstion
                            const fExt = (body as File).name.substring( (body as File).name.indexOf('.')+1 ).toUpperCase();
                            switch(fExt) {
                                case 'JSONL':
                                    retVal = 'application/x-jsonlines';
                                    break;
                                case 'CSV':
                                    retVal = 'text/csv';
                                    break;
                                case 'XLS':
                                    retVal = 'application/vnd.ms-excel';
                                    break;
                            }
                        }
                        break;
                }
                return retVal;
            } else if(typeof (body as string) === 'string') {
                // probably json
                try{
                    const isValidJSON = JSON.parse((body as string));
                    if(isValidJSON && isValidJSON.length >= 1 && isValidJSON.forEach) {
                        // probably json lines
                        return 'application/x-jsonlines';
                    }
                    return 'application/json';
                } catch(err) {
                    // maybe csv plain text
                    return 'text/csv';
                }
            }
        }
        return undefined;
    }

    /**
     * Select the correct accept content-type to use for a request.
     * Uses {@link Configuration#isJsonMime} to determine the correct accept content-type.
     * If no content type is found return the first found type if the contentTypes is not empty
     * @param accepts - the array of content types that are available for selection.
     * @returns the selected content-type or <code>undefined</code> if no selection could be made.
     */
    public selectHeaderAccept(accepts: string[], body?: string | Blob | File | Array<{ [key: string]: any; }>): string | undefined {
        if (body) {
            return this.getMimeTypeFromBody(body);
        }
        if (accepts.length == 0) {
            return undefined;
        }

        let type = accepts.find(x => this.isJsonMime(x));
        if (type === undefined) {
            return accepts[0];
        }
        return type;
    }

    /**
     * Check if the given MIME is a JSON MIME.
     * JSON MIME examples:
     *   application/json
     *   application/json; charset=UTF8
     *   APPLICATION/JSON
     *   application/vnd.company+json
     * @param mime - MIME (Multipurpose Internet Mail Extensions)
     * @return True if the given MIME is JSON, false otherwise.
     */
    public isJsonMime(mime: string): boolean {
        const jsonMime: RegExp = new RegExp('^(application\/json|[^;/ \t]+\/[^;/ \t]+[+]json)[ \t]*(;.*)?$', 'i');
        return mime != null && (jsonMime.test(mime) || mime.toLowerCase() === 'application/json-patch+json');
    }
    /** 
     * additional http/https request headers that will be added by default to 
     * all outbound api server requests.
     */
    public get additionalHeaders(): {[key: string]: string} | undefined {
        if(this._additionalHeaders) {
            let retVal: {[key: string]: string} = {};
            this._additionalHeaders.forEach((httpHeader) => {
                retVal[ httpHeader.key ] = httpHeader.value;
            });
            return retVal;
        }
        return undefined;
    }
    /** 
     * set additional http/https request headers to be added by default to 
     * all outbound api server requests. most commonly used for adding custom 
     * or required non-standard headers like jwt session tokens, auth id etc.
     */
    public set additionalHeaders(value: {[key: string]: string} | undefined) {
        if(value === undefined) { return; }
        if(value && value !== undefined && value !== null) {
            this._additionalHeaders = []; // set to empty
            let _keys = Object.keys( value );
            this._additionalHeaders = _keys.map((_keyName) => {
                let _value = value[ _keyName ];
                return {'key': _keyName, 'value': _value}
            });
        } else if(value === undefined && value === null) {
            this._additionalHeaders = undefined;
        }
    }
    /** add an additional header to all outgoing API requests */
    public addAdditionalRequestHeader(header: {[key: string]: string}) {
        if(header){
            let keys = Object.keys(header);
            if(keys && keys.length > 0) {
                let alreadyExistsAtIndex = -1;
                if(!this._additionalHeaders){
                    this._additionalHeaders = [];
                } else {
                    alreadyExistsAtIndex = this._additionalHeaders.findIndex((eheader: {[key: string]: string}) => {
                        return eheader['key'] === keys[0];
                    })
                }
                if( this._additionalHeaders && !this._additionalHeaders[alreadyExistsAtIndex]) {
                    this._additionalHeaders.push({key: keys[0], value: (header[ keys[0] ]) });
                }
            }
        }
    }
    /** remove an additional header from all outgoing API requests */
    public removeAdditionalRequestHeader(header: {[key: string]: string} | string) {
        if(header){
            let keyToRemove = (header as string);
            if( (header as string).indexOf ){
                // parameter is string
            } else {
                // must be object
                let keys = Object.keys(header as {[key: string]: string});
                if(keys && keys.length > 0){
                    keyToRemove = keys[0];
                }
            }
            if(keyToRemove && this._additionalHeaders && this._additionalHeaders.length > 0) {
                let alreadyExistsAtIndex = this._additionalHeaders.findIndex((eheader: {[key: string]: string}) => {
                    return eheader['key'] === keyToRemove;
                })
                if(alreadyExistsAtIndex && this._additionalHeaders[ alreadyExistsAtIndex ]) {
                    //this._additionalHeaders.push({key: keys[0], value: (header[ keys[0] ]) });
                    this._additionalHeaders = this._additionalHeaders.splice(alreadyExistsAtIndex, 1);
                }
            }
        }
    }
}
