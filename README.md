# simple-template-mailer

 Simple manage templates and translations, bulid and send mails. For medium projects.
 Uses "mustache" to compile html, "inline" for embedding external referneces (css, js, images)
 into html and nodemailer for sending.

 Note: This Module is in early stage

## ToDo
 * test the "inline" function
 * github repo
 * testing

## Installation
>npm install simple-template-mailer

## Example

```js

// init the module
var simpleTemplateMailer = require('simple-template-mailer');

var mailer = simpleTemplateMailer({ // create a instance
  transporter:  { // nodemailer tramporter options; parameters should be fetched from an external config
          host: 'smtp.test.mail.address',
          requiresAuth: false,
  },
  translationsPath: "./translations", // template options
  templatesPath: "./templates",
  defaultLanguage: "de"
});


// usage
mailer.send({  name: 'newsletter', // template name
            language: "en",
            data: {test: 234}}, // data from your app inserted in template
            {to:["max.mustermann@gmx.net"]} // nodemailer options
        );

```

Corresponding translation file
```json
{
    "newsletter": "this is the subject for template 'newsletter'; mustache can be used here too: {{jsonMessage}}",
    "jsonMessage": "hello, I'm a message from the translation file" ,
    "footer": "<div class='footer'><div>"
}
```

Corresponding template file
```html
<html>

<head>
    <link rel="stylesheet" href="../global.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>

<h1>simpleTemplateMailer newsletter message<h1>

{{lang.jsonMessage}}

<!-- mustache also allows html templating from the json files -->
{{{footer}}}

</body>
</html>

```

### Folder structure in your project

Note: The translations folder holds all translations for the mails + the subject messages (json key has the same name, as the template).
```

mail
  |__translations (for mustache, and also subjects)
  |      |_de.json
  |      |_en.json
  |      |_fr.json
  |
  |__templates
       |
       |_ global.css (this css can be embedde everywhere using "inline")
       |
       |_ newsletter
       |  |_ template.html
       |
       |_ orderconfirm
          |_ template.html
          |_ styles.css (custom css embedded with "inline")

```


### Use Nodemailer direct
```js
mailer.send(null, {to:["jon.doe@gmx.io"], text:"HelloWorld"});

```

### Usage of nodemailer and inline
https://nodemailer.com/message/

https://www.npmjs.com/package/inline-source



### License
 ISC. Feel free to use.
