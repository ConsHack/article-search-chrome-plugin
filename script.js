var Hapi = require('hapi'),
    Path = require('path'),
    Bell = require('bell'),
    AuthCookie = require('hapi-auth-cookie'),

    server = new Hapi.Server();

server.connection({ port: process.env.PORT });

// serves up views (html template pages)
/*server.views({
  engines: {
    html: require('handlebars')
  },
  path: Path.join(__dirname, "views")
});
*/

var authOptions = {
    provider: 'google',
    password: process.env.GOOGLE_ENCRYPTION_PASSWORD, //Password used for encryption
    clientId: process.env.GOOGLE_CLIENT_ID,//'YourAppId',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,//'YourAppSecret',
    isSecure: false //means authentication can occur over http
};

//register plugins with server
server.register([Bell, AuthCookie], function (err) {
  if (err) throw err;


    server.auth.strategy("google", 'bell', authOptions);

    server.auth.strategy('session', 'cookie', {
        cookie: 'sid',
        password: process.env.COOKIE_PW,
        // redirectTo: '/', //this allows logout to work!
        isSecure: false
        // ttl: 3000  //expiry time of cookie
        // clearInvalid: true
    });

    server.auth.default('session');  //if no auth is specified it defaults to checking the session cookie
    server.route({
      method: ['GET', 'POST'],
      path: '/',
      config: {
        auth: {
          mode: "try",
          strategy: "google"
        },
        handler: function(request, reply) {
          request.log('analytics request is being sent');
          if(request.auth.isAuthenticated) {
            request.auth.session.set(request.auth.credentials.profile);
            reply.file('views/dashboard.html');
            console.log(request.auth.credentials);
            console.log('Is isAuthenticated: '+request.auth.isAuthenticated);
            var creds = request.auth.credentials;
                    
              var profile = {
                  googleId: creds.profile.id,
                  fullName: creds.profile.displayName,
                  firstName: creds.profile.name.first,
                  email: creds.profile.email,
                  pictures : []
              };


          } else {
            reply.file("views/popup.html").code(401);
          }
        }
    }
    });
  }
);

server.start(function () {
    console.log('Server running at: ' + server.info.uri);
});


