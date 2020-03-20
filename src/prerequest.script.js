var crypto = require('crypto-js');

/**
 * WSSEToken
 * @constructor
 * @param {Object} options
 * @return {WSSEToken}
 */
function WSSEToken( options ) {

    if( !(this instanceof WSSEToken) )
        return new WSSEToken( options )

    if( !(options.user || options.username) )
        throw new Error( 'Empty username' )

    if( !options.password )
        throw new Error( 'Empty password' )

    this.user = options.user || options.username
    this.password = options.password

    this.nonceBytes = options.nonceBytes || 16
    this.nonceEncoding = options.nonceEncoding || 'hex'

    this.digestAlgorithm = options.digestAlgorithm || 'sha1'
    this.digestEncoding = options.digestEncoding || 'hex'
    this.digestBase64 = options.digestBase64 !== null ?
        options.digestBase64 : true

}

function base64( value ) {
    return Buffer.from( value ).toString( 'base64' )
}

/**
 * WSSEToken prototype
 * @type {Object}
 */
WSSEToken.prototype = {

    constructor: WSSEToken,

    getTimestamp: function() {
        return new Date().toIsoString()
    },

    getNonce: function( encoding ) {
        return crypto.MD5(this.nonceBytes)
    },

    getDigest: function( nonce, timestamp ) {
        return crypto.SHA1( nonce + timestamp + this.password )
    },

    toString: function() {

        var nonce = this.getNonce()
        var timestamp = this.getTimestamp()
        var digest = this.getDigest( nonce, timestamp )

        return 'UsernameToken Username="' + this.user +
            '", PasswordDigest="' + crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(digest)) +
            '", Nonce="' + nonce +
            '", Created="' + timestamp + '"'

    },

}

Date.prototype.toIsoString = function() {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        'T' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds()) +
        dif + pad(tzo / 60) +
        '' + pad(tzo % 60);
}

var token = new WSSEToken({
    user: pm.environment.get("emarsys_username"),
    password: pm.environment.get("emarsys_password")
})

// \"X-WSSE: UsernameToken Username=\\\"your_username\\\", PasswordDigest=\\\"XXXXXXXXXXXXXXXXXXXXXXXX\\\", Nonce=\\\"yyyyyyyyyyyyyyyyyyyyy\\\", Created=\\\"2020-10-23T12:06:00+0300\\\"

pm.request.headers.upsert({key: 'X-WSSE', value: token.toString()})