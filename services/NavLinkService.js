class NavLinkService {
    constructor() {
        this.navLinks = [];
        this.customNavLinks = [
            { "label": "About", "url": "/about" }
        ];
    }

    getNavLinks() {
        return this.navLinks || [];
    }

    getCustomNavLinks() {
        return this.customNavLinks || [];
    }

    registerCustomLinks(links) {
        this.customNavLinks = links;
    }

    registerNavLinks(links) {
        this.navLinks = links;
    }

    clearLinkClasses() {
        if (typeof(this.navLinks) != 'undefined')
        {
            this.navLinks.forEach(navLink => delete navLink.class);
        }
        if (typeof(this.customNavLinks) != 'undefined') {
            this.customNavLinks.forEach(navLink => delete navLink.class);
        }
    }

    setNavLinkActive(url) {
        const navLink = this.navLinks.find(navLink => navLink.url === url);
        if (navLink) {
            navLink.class = 'active';
        }
    }

    setCustomNavLinkActive(url) {
        const customNavLink = this.customNavLinks.find(navLink => navLink.url === url);
        if (customNavLink) {
            customNavLink.class = 'active';
        }
    }
}

module.exports = NavLinkService