var simpleTemplateMailer = require('simple-template-mailer');
var config = require('./config/config.js');


// init
var mailer = simpleTemplateMailer({ // create a instance
  transporter: config.transporter, // mail options from external configuration file
  translationsPath: "./translations",
  templatesPath: "./templates",
  defaultLanguage: "de"
});




// call with several options
mailer.mail({ // template options

    name: 'newsletter', // template folder name

    language: "de", // select json translation file

    data: { // data from your app for mustache
      testData: "HelloWorld"
    }
  }, { // nodemailer options; recipients need to be specified

    to: ["max.mustermann@web.net"]
    /* further parameter: https://nodemailer.com/message/
    attachements: files,
    replyTo: ["max.muster@web.net"]
    */
  },

  function(data, info) {}, // on sucess

  function(err, info) {} // on error
);
