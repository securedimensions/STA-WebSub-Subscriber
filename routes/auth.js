const express = require('express');

const requireAuth = async (req, res, next) => {
    if (!req.session.user) {
        const back = encodeURIComponent(req.originalUrl);
        res.redirect('/login?return=' + back);
    } else {
        next();
    }
  };

module.exports = requireAuth;