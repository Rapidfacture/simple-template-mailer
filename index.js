/** simpleTemplateMailer
 * @desc
 * Simple manage templates and translations, bulid and send mails. For medium projects.
 * Uses "mustache" to compile html, "inline" for embedding external referneces (css, js, images)
 * into html and nodemailer for sending.
 * @author felix furtmayr, ff@rapidfacture.com, Rapidfacture GmbH
 * @license ISC
 */


// dependencys
const fs = require('fs'),
   mustache = require('mustache'),
   inline = require('inline-source'),
   nodemailer = require('nodemailer'),
   htmlToText = require('html-to-text');

// options passed when creating an instance
var opts = {};

// json tranlation files will be stored here
var translations = [];



/** create an instance
 *
 * @example
 * var mail = simpleTemplateMailer({
 *  defaultLanguage: 'en',
 *  transporter:  { // nodemailer tramporter options
 *     host: 'smtp.test.mail.address',
 *     requiresAuth: false,
 *  },
 *  translationsPath: __dirname +  "/translations",
 *  templatesPath: __dirname + "/templates",
 * });
 *
 */
module.exports = function (config) {

   // options passed when creating an instance
   opts = {
      defaultLanguage: config.defaultLanguage || 'de',
      transporter: nodemailer.createTransport(config.transporter),
      translationsPath: config.translationsPath || 'translations',
      templatesPath: config.templatesPath || 'templates',
      inlineAttribute: config.inlineAttribute || false
   };

   // init: read all json translatonFiles and store them in "translations"
   _getTranslations();

   // external methods
   return {
      getTemplate: _getTemplate,
      send: _send
   };
};



// read all json translatonFiles and store them in "translations"
function _getTranslations () {

   // get file names
   var translatonFiles = _getAllFilesFromFolder(opts.translationsPath);
   function _getAllFilesFromFolder (dir) {
      var results = [];
      fs.readdirSync(dir).forEach(function (file) {
         var filePath = dir + '/' + file;
         var stat = fs.statSync(filePath);
         if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(filePath));
         } else {
            results.push({
               path: filePath,
               name: file.split('.')[0]
            });
         }
      });
      return results;
   }

   // store file content in "translations"
   translatonFiles.forEach(function (translationFile) {
      try {
         translations[translationFile.name] = JSON.parse(fs.readFileSync(translationFile.path, 'utf8'));
      } catch (err) {
         error('Error in json file ' + translationFile.name + ': ' + err);
      }
   });

}



function _getTemplate (template, successFunction, errorFunction) {

   // check input data
   if (!template) {
      error('no template defined', errorFunction);
      return;
   }
   var lang, message = {};
   if (template.language && translations[template.language]) {
      lang = translations[template.language]; // get choosen translation
   } else if (translations && opts.defaultLanguage) {
      _log('no language found, switching to default');
      lang = translations[opts.defaultLanguage];
   } else {
      _log('no language defined');
   }


   // subject: compile with mustache
   if (lang[template.name]) {
      var htmlSubject = lang[template.name];
      message.subject = mustache.render( //
         htmlSubject, { // json inserted in "{{ }}"
            data: template.data,
            lang: lang
         });
   }


   // html message : compile with mustache, then inline extern css/js/img
   var templateDir = opts.templatesPath + '/' + template.name;
   var templateHtml = templateDir + '/template.html';

   try { // compile with mustache
      message.html = null;
      if (fs.existsSync(templateHtml)) {
         message.html = mustache.render(
            fs.readFileSync(templateHtml, 'utf8'), { // json inserted in "{{ }}"
               data: template.data,
               lang: lang
            });
      }

      // only html availale => parse text from html to text
      if (!message.text && message.html) message.text = htmlToText.fromString(message.html, { wordwrap: 130 });

      var inlineAttribute;
      if (template.inlineAttribute || template.inlineAttribute === false) {
         inlineAttribute = template.inlineAttribute;
      } else {
         inlineAttribute = opts.inlineAttribute;
      }

      try { // inline sources (css, images)
      // https://www.npmjs.com/package/inline-source
         inline(message.html, {
            compress: true,
            attribute: inlineAttribute,
            rootpath: templateDir
         }, function (err, html) {
            if (err) {
               error('Inline error: ' + err, errorFunction);
               return;
            }
            message.html = html;
            successFunction(message);
         });

      } catch (err) {
         error(err, errorFunction);
         return;
      }
   } catch (templateErr) {
      error('Template file not found ' + templateDir + ', ' + templateErr, errorFunction);

   }
}


function _send (template, message, callback, errorFunction) {

   if (!message || !message.to) {
      error('no template and no options defined for nodemailer', errorFunction);
      return;
   }
   _getTemplate(template, function (mailContent) {

      message.subject = message.subject || mailContent.subject;
      message.html = message.html || mailContent.html;
      message.text = message.text || mailContent.text;

      // send mail with nodemailer
      // options: https://nodemailer.com/message/
      opts.transporter.sendMail(message,
         function (err, info) {
            if (err) {
               error('error in sendMail: ' + err, errorFunction);
            } else {
               if (callback) {
                  callback(message, info);
               } else {
                  _log('message sent: ', info);
               }
            }
         });
   }, errorFunction);
}



function _log () {
   var args = [].slice.apply(arguments);
   args.unshift('simple-template-mailer ');
   console.log.apply(this, args);
}

function error (message, errorFunction) {
   if (errorFunction) {
      errorFunction(message);
   } else {
      console.log('simple-template-mailer error: ', message);
   }
}
