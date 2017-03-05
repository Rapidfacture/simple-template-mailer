/** simpleTemplateMailer
 * @desc
 * Simple manage templates and translations, bulid and send mails. For medium projects.
 * Uses "mustache" to compile html, "inline" for embedding external referneces (css, js, images)
 * into html and nodemailer for sending.
 * @author felix furtmayr, ff@rapidfacture.com, Rapidfacture GmbH
 * @license ISC
 */

var inline = require('inline-source').sync; // synchronous version
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var fs = require('fs');

// create an instance: var mail = simpleTemplateMailer();
module.exports = function(config) {

  var mailer = {

    // Options that should be passed when creating an instance
    transporter: nodemailer.createTransport(config.transporter),
    translationsPath: config.translationsPath || null,
    templatesPath: config.templatesPath || 'templates',

    send: function(template, options, callback, errorFunction) {

      var message = options;

      if (template) { // => prepare templates

        message = message || {};

        var lang;

        if (template.language && this.translations[template.language]) {
          lang = this.translations[template.language]; // get choosen translation
        } else if (this.translations && config.defaultLanguage) {
          log("no language found, switching to default");
          lang = this.translations[config.defaultLanguage];
        } else {
          log("no language defined");
        }


        // subject
        if (lang[template.name]) {
          var htmlSubject = lang[template.name];
          message.subject = mustache.render( // compile with mustache
            htmlSubject, { // json inserted in "{{ }}"
              data: template.data,
              lang: lang
            });
        }



        // html message
        try {

          var htmlstring = "";
          var templateDir = this.templatesPath + "/" + template.name + '/template.html';

          try {
            htmlstring = fs.readFileSync(templateDir, 'utf8');
          } catch (err) {
            error("Template file not found " + templateDir + ", " + err, errorFunction);
            return;
          }

          // inline sources (css, images)
          // https://www.npmjs.com/package/inline-source

          var htmlTemplate = inline(htmlstring, {
            compress: true,
            // Skip all script tags
            ignore: 'script'
          });


          message.html = mustache.render( // compile with mustache
            htmlstring, { // json inserted in "{{ }}"
              data: template.data,
              lang: lang
            });
        } catch (err) {
          error(err, errorFunction);
          return;
        }

      } else if (!message || !message.to) {
        error("template and options defined for nodemailer", errorFunction);
        return;
      }


      // send mail with nodemailer /////////////////////////////////
      this.transporter.sendMail(message, // options here: https://nodemailer.com/message/
        function(err, info) {
          if (err) {
            error("error in sendMail: " + err, errorFunction);
          } else {
            if (callback) {
              callback(message, info);
            } else {
              log('message sent: ', [info]);
            }
          }
        });
    },
  };




  mailer.translations = function() {

    // get translation file names
    var translatonFiles = _getAllFilesFromFolder(mailer.translationsPath);

    function _getAllFilesFromFolder(dir) {
      var results = [];
      fs.readdirSync(dir).forEach(function(file) {

        filePath = dir + '/' + file;
        var stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
          results = results.concat(_getAllFilesFromFolder(filePath));
        } else results.push({
          path: filePath,
          name: file.split(".")[0]
        });
      });
      return results;
    }

    // store translation file content
    var translations = {};
    translatonFiles.forEach(function(translationFile) {
        try{
            translations[translationFile.name] = JSON.parse(fs.readFileSync(translationFile.path, 'utf8'));
        }catch(err){
            error("Error in json file " + translationFile.name + ": " + err);
        }
    });

    return translations;
  }();



  return mailer;
};




function log(message, args) {
  args = args || [];
  args.unshift(message);
  args.unshift("node-template-mailer ");
  console.log.apply(this, args);
}

function error(message, callback) {
  if (callback) {
    callback(message);
  } else {
    console.log("node-template-mailer error: ", message);
  }
}
