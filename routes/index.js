var express = require('express');
var router = express.Router();

function homepage(req, res) {
  res.render('home', {
    title: 'A foursquare experience for Windows Phone',
    isWide: true,
    extraFeeds: '<meta property="fb:page_id" content="145528958837083" />',
    extraCss: '<link rel="stylesheet" href="https://az523807.vo.msecnd.net/site/media/fancybox/jquery.fancybox-1.3.4.css" type="text/css" media="screen" /><script type="text/javascript" src="https://az523807.vo.msecnd.net/site/media/fancybox/jquery.fancybox-1.3.4.pack.js"></script>'
  });
}

router.get('/', homepage);
router.get('/home', homepage);
router.get('/index.html', homepage);

function features(req, res) {
  res.render('features', {
    title: 'Features and Screenshots',
    isWide: true,
  });
}

router.get('/features', features);
router.get('/features/index.html', features);

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Jeff Wilcox',
    isWide: true,
  });
});

router.get('/about/developer.html', (req, res) => {
  res.render('about', {
    title: 'About Jeff Wilcox',
    isWide: true,
  });
});

function privacy(req, res) {
  res.render('privacy', {
    title: 'Privacy',
    isWide: true,
  });
}

router.get('/privacy', privacy);
router.get('/privacy.html', privacy);

function support(req, res) {
  res.render('support', {
    title: 'Support and Feedback',
    isWide: true,
  });
}

router.get('/support', support);
router.get('/support/index.html', support);

module.exports = router;
