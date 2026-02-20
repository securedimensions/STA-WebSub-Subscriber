const express = require('express');
const router = express.Router();
const path = require("path");
const crypto = require('crypto')
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');

const navLinkService = new NavLinkService();
navLinkService.registerCustomLinks([
    { "label": "About", "url": "/about" }
]);

const user = { 'username': process.env.LOGIN || 'admin', 'password': crypto.createHash('sha1').update(process.env.PASSWORD || 'admin').digest('hex') }

router.get('/login', async function (req, res, next) {

    let back = '/user';
    if (req.query && 'return' in req.query)
        back = decodeURIComponent(req.query.return);

    res.render('login', {
        agentName: process.env.APP_NAME,
        navLinks: navLinkService.getNavLinks(),
        customNavLinks: navLinkService.getCustomNavLinks(),
        errors: req.errors || null,
        error_keys: (req.errors || []).map(error => error.param),
        return: encodeURIComponent(back)
    });
});

router.post("/login",
    [
        check('username').notEmpty().withMessage('username is required'),
        check('password').notEmpty().withMessage('password is required')
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        const { username, password } = req.body;
        const back = req.body.return || '/user';

        let hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

        if ((username === user.username) && (hashedPassword == user.password)) {
            req.session.user = username;
            res.status(200).redirect(decodeURIComponent(back));
        } else {
            req.errors = errors.array();
            return res.render('login', {
                agentName: process.env.APP_NAME,
                navLinks: navLinkService.getNavLinks(),
                customNavLinks: navLinkService.getCustomNavLinks(),
                username: username,
                password: '',
                errors: req.errors || null,
                error_keys: (req.errors || []).map(error => error.param),
                login_error: 'invalid login',
                return: back
            });
        }

    });

module.exports = router;