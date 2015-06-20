var Hapi = require('hapi'),
    Path = require('path'),
    Bell = require('bell'),
    AuthCookie = require('hapi-auth-cookie'),
    server = new Hapi.Server();

server.connection({ port: process.env.PORT });

// serves up views (html template pages)
server.views({
  engines: {
    html: require('handlebars')
  },
  path: Path.join(__dirname, "views")
});

var authOptions = {
    provider: 'google',
    password: process.env.GOOGLE_ENCRYPTION_PASSWORD, //Password used for encryption
    clientId: process.env.GOOGLE_CLIENT_ID,//'YourAppId',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,//'YourAppSecret',
    isSecure: false //means authentication can occur over http
};

//register plugins with server
server.register(
  [
  { register: Bell},
  { register: AuthCookie}
  ],

  function (err) {
    if (err) {
      throw err; // something bad happened loading the plugin
    }

    server.auth.strategy("google", 'bell', authOptions);

    server.auth.strategy('session', 'cookie', {
        cookie: 'sid',
        password: '12345678',
        // redirectTo: '/', //this allows logout to work!
        isSecure: false
        // ttl: 3000  //expiry time of cookie
        // clearInvalid: true
    });

    server.auth.default('session');  //if no auth is specified it defaults to checking the session cookie
    server.route({
      method: ['GET', 'POST'],
      path: '/login',
      config: {
        auth: {
          mode: "optional",
          strategy: "google"
        },
        handler: function(request, reply) {
          request.log('analytics request is being sent');
          if(request.auth.isAuthenticated) {
            request.auth.session.set(request.auth.credentials.profile);
            reply.redirect('/my-account');
          } else {
            reply.redirect("/").code(401);
          }
        }
    }
    });
  }
);

server.start(function () {
    server.log('Server running at: ' + server.info.uri);
});


module.exports = server;