// Assign jQuery to a different variable to avoid conflicts with other versions of the library
var btkjQuery = $.noConflict();

btkjQuery(function () {

    // jQuery no conflict to avoid conflicts with other versions of jQuery which may be included on a page

    // Required for IE9 compatibility 
    btkjQuery.support.cors = true;

    var BTKUniclassSyndicator = function (target) {
        // Add reference to the element which should be populated with syndicated content
        this.target = target;

        // Find BIM toolkit frontend hostname by looking at script src
        var scriptUrl = btkjQuery('#btk_syndication-script').attr('src');
        this.btkHostname = scriptUrl !== null ? this.hostFromUrl(scriptUrl, true) : 'https://toolkit.thenbs.com';

        // Find API hostname (from mappings)
        this.apiHostname = this.apiHostForFrontendHost(this.hostFromUrl(this.btkHostname, false));
    };

    // Maps possible values of BTK frontent hosts to the API host
    BTKUniclassSyndicator.prototype.apiHostForFrontendHost = function (frontendHostname) {
        //console.log(frontendHostname);
        // Need to use client location protocol as IE9 will not allow cross domain request with a different protocol
        switch (frontendHostname) {
            case 'toolkit.thenbs.com':
            case 'toolkit.thenbs.com:443':
                return location.protocol + '//toolkit-svc.thenbs.com'; break;
            case 'bimtoolkit-staging.thenbs.com':
            case 'bimtoolkit-staging.thenbs.com:443':
                return location.protocol + '//bimtoolkitsvc-staging.thenbs.com'; break;
            case 'toolkit.ribac.local': return location.protocol === 'https:' ? 'https://toolkit-api.ribac.local' : 'http://localhost:52927'; break;
            case 'bimtoolkit-dev.thenbs.com': return location.protocol + '//bimtoolkit-api.thenbs.com'; break;
            default: return location.protocol + '//toolkit-svc.thenbs.com';
        }
    };

    // Helper methods

    // Get the host component of a provided url string
    BTKUniclassSyndicator.prototype.hostFromUrl = function (url, includeProtocol) {
        var locationEl = document.createElement('a');
        locationEl.href = url;
        return (includeProtocol ? locationEl.protocol + '//' : '') + locationEl.host;
    };

    // Generate and return the query string for google analytics
    BTKUniclassSyndicator.prototype.generateAnalyticsParams = function (campaignName) {
        return '?utm_source=' + encodeURIComponent(location.host) + '&utm_medium=syndication&utm_campaign=' + encodeURIComponent(campaignName);
    };

    // Generate and return hidden inputs for adding google analytics parameters to a form get
    BTKUniclassSyndicator.prototype.generateAnalyticsFormFields = function (campaignName) {
        return '<input type=\'hidden\' name=\'utm_source\' value=\'' + location.host + '\' />'
            + '<input type=\'hidden\' name=\'utm_medium\' value=\'syndication\' />'
            + '<input type=\'hidden\' name=\'utm_campaign\' value=\'' + campaignName + '\' />';
    };

    // HTML loading

    // Loads the index html and passes it to the success callback
    BTKUniclassSyndicator.prototype.loadIndexHtml = function (success) {
        var self = this;
        var html = '<table id=\'btk_classificationTable\'><thead><tr><th>Code</th><th>Title</th></tr></thead><tbody>';
        html += '</tbody></table>';
        success(self.applyTemplate(html));
    };

    BTKUniclassSyndicator.prototype.loadErrorHtml = function () {
        return this.applyTemplate('<p class=\'btk_centralised btk_error\'>Uniclass 2015 data is not available at this time. <a class=\'btk_button btk_navToIndex\'>Try Again</a></p>')
    };

    BTKUniclassSyndicator.prototype.applyTemplate = function (contentHtml) {
        var html = '<h2>Browse Uniclass 2015</h2>';
        html += contentHtml;
        html += '<div class=\'btk_footer\'>';
        html += '<a href=\'http://www.thenbs.com/' + this.generateAnalyticsParams('nbs') + '\' target=\'_blank\'><img src=\'' + this.btkHostname + '/content/images/nbs-logo-template.png\' alt=\'NBS\' /></a><div class=\'btk_right\'><p><a href=\'' + this.btkHostname + '/articles/classification' + this.generateAnalyticsParams('findOutMore') + '#classificationtables\' target=\'_blank\'>Download the Uniclass 2015 tables&nbsp;<i class=\'fa fa-external-link\'></i></a></p></div>';
        html += '</div>';
        return html;
    };

    // Rendering

    // Binds any required events
    BTKUniclassSyndicator.prototype.bindEvents = function () {
        var syndicator = this;

        // Limit pager to 5 numbers
        //btkjQuery.fn.DataTable.ext.pager.numbers_length = 6;

        // Set up the PDT data table
        var table = btkjQuery('#btk_classificationTable').DataTable({
            'dom': 'f<"toolbar">rtp',
            // Feature control
            "paging": true,
            "searching": true,
            "info": true,
            "scrollY": "1500px",
            "scrollCollapse": true,
            "ajax": this.apiHostname + '/api/classificationsyndication',
            // Configure datatables responsive plugin to remove columns
            "responsive": {
                details: {
                    display: btkjQuery.fn.dataTable.Responsive.display.childRowImmediate,
                    type: ''
                }
            },
            'language': {
                'search': 'Search Uniclass2015:',
                'paginate': {
                    'previous': "Prev"
                }
            },
            // Disable initial table sort
            "aaSorting": []
        });

        btkjQuery('div.toolbar').html('<span>Filter by: </span><select id="btktableFilter"><option value="-">All tables</option><option value="Co">Complexes</option><option value="En">Entities</option><option value="Ac">Activities</option><option value="SL">Spaces/locations</option><option value="EF">Elements/functions</option><option value="Ss">Systems</option><option value="Pr">Products</option><option value="TE">Tools and Equipment</option><option value="Zz">CAD</option><option value="FI">Form of Information</option><option value="PM">Project management</option><option value="Ro">Roles</option></select>');

        // Filter table based on table selected
        btkjQuery('#btktableFilter').change(function () {
            var val = this.value;

            if (val === '-') {
                table.columns(0).search('').draw();
            } else {
                table.columns(0).search(val).draw();
            }
        });
    };

    // Populates the target element with the provided html and binds any events
    BTKUniclassSyndicator.prototype.render = function (html) {
        this.target.html(html);
        this.bindEvents();
    };

    // Navigation

    // Navigates to the 'index' page showing a A-Z summary of templates
    BTKUniclassSyndicator.prototype.navigateToIndex = function () {
        var self = this;
        this.loadIndexHtml(function (html) {
            self.render(html);
        });
    };

    // Add jQuery method for loading the index

    // Adds the showClassifications method so it can be called by jQuery
    btkjQuery.fn.showClassifications = function () {
        new BTKUniclassSyndicator(this).navigateToIndex();
    };

});