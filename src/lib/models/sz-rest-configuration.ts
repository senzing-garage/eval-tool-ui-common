export interface SzRestConfigurationParameters {
    apiKeys?: {[ key: string ]: string};
    username?: string;
    password?: string;
    accessToken?: string | (() => string);
    basePath?: string;
    withCredentials?: boolean;
    additionalHeaders?: {[key: string]: string};
}

export class SzRestConfiguration {
    apiKeys?: {[ key: string ]: string};
    username?: string;
    password?: string;
    accessToken?: string | (() => string);
    basePath?: string;
    withCredentials?: boolean;
    /** @internal */
    private _additionalHeaders: {key: string, value: string}[] | undefined;

    constructor(configurationParameters: SzRestConfigurationParameters = {}) {
        this.apiKeys = configurationParameters.apiKeys;
        this.username = configurationParameters.username;
        this.password = configurationParameters.password;
        this.accessToken = configurationParameters.accessToken;
        this.basePath = configurationParameters.basePath;
        this.withCredentials = configurationParameters.withCredentials;
        if(configurationParameters.additionalHeaders) {
            this.additionalHeaders = configurationParameters.additionalHeaders;
        }
    }

    public get configurationParameters(): SzRestConfigurationParameters {
        let retVal: SzRestConfigurationParameters = {};
        if(this.apiKeys !== undefined && this.apiKeys !== null) retVal.apiKeys = this.apiKeys;
        if(this.username !== undefined && this.username !== null) retVal.username = this.username;
        if(this.password !== undefined && this.password !== null) retVal.password = this.password;
        if(this.accessToken !== undefined && this.accessToken !== null) retVal.accessToken = this.accessToken;
        if(this.basePath !== undefined && this.basePath !== null) retVal.basePath = this.basePath;
        if(this.withCredentials !== undefined && this.withCredentials !== null) retVal.withCredentials = this.withCredentials;
        if(this.additionalHeaders !== undefined && this.additionalHeaders !== null) retVal.additionalHeaders = this.additionalHeaders;
        return retVal;
    }

    public set configurationParameters(value: SzRestConfigurationParameters) {
        if(value.apiKeys !== undefined && value.apiKeys !== null) this.apiKeys = value.apiKeys;
        if(value.username !== undefined && value.username !== null) this.username = value.username;
        if(value.password !== undefined && value.password !== null) this.password = value.password;
        if(value.accessToken !== undefined && value.accessToken !== null) this.accessToken = value.accessToken;
        if(value.basePath !== undefined && value.basePath !== null) this.basePath = value.basePath;
        if(value.withCredentials !== undefined && value.withCredentials !== null) this.withCredentials = value.withCredentials;
        if(value.additionalHeaders !== undefined && value.additionalHeaders !== null) this.additionalHeaders = value.additionalHeaders;
    }

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

    public set additionalHeaders(value: {[key: string]: string} | undefined) {
        if(value === undefined) { return; }
        if(value !== null) {
            this._additionalHeaders = [];
            let _keys = Object.keys( value );
            this._additionalHeaders = _keys.map((_keyName) => {
                let _value = value[ _keyName ];
                return {'key': _keyName, 'value': _value}
            });
        } else {
            this._additionalHeaders = undefined;
        }
    }

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

    public removeAdditionalRequestHeader(header: {[key: string]: string} | string) {
        if(header){
            let keyToRemove: string;
            if(typeof header === 'string') {
                keyToRemove = header;
            } else {
                let keys = Object.keys(header);
                if(keys && keys.length > 0){
                    keyToRemove = keys[0];
                }
            }
            if(keyToRemove && this._additionalHeaders && this._additionalHeaders.length > 0) {
                let alreadyExistsAtIndex = this._additionalHeaders.findIndex((eheader: {[key: string]: string}) => {
                    return eheader['key'] === keyToRemove;
                })
                if(alreadyExistsAtIndex !== -1) {
                    this._additionalHeaders.splice(alreadyExistsAtIndex, 1);
                }
            }
        }
    }
}
