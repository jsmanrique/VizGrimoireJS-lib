/* 
 *
 * Copyright (C) 2012, Bitergia
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *  
 *  MLS.js: Library for visualizing Bitergia MLS data
 */



function MLS() {

    // Work around: http://bit.ly/yP8tGP
    var self = this;
    var data_lists = null;


    self.displayEvo = displayEvo;
    self.displayEvoAggregated = displayEvoAggregated;
    self.displayBasic = displayBasic;
    self.displayBasicMetricHTML = displayBasicMetricHTML;
    self.displayBasicListSelector = displayBasicListSelector;
    self.displayEvoListSelector = displayEvoListSelector;
    self.displayEvoBasicListSelector = displayEvoBasicListSelector;
    self.displayBasicUser = displayBasicUser;
    self.displayEvoUser = displayEvoUser;
    self.displayEvoUserAll = displayEvoUserAll;
    self.displayBasicUserAll = displayBasicUserAll;
    self.displayEvoDefault = displayEvoDefault;
    self.displayBasicDefault = displayBasicDefault;
    self.getMainMetric = function() {
        return "sent";
    };
    self.getMetrics = function() {return basic_metrics;};
    self.getListsFile = function() {return self.data_lists_file;};
    self.getListsData = function() {return data_lists;};
    self.setListsData = function(lists) {data_lists = lists;};    

    var basic_metrics = {
        'sent' : {
            'divid' : "mls-sent",
            'column' : "sent",
            'name' : "Sent",
            'desc' : "Number of messages"
        },
        'senders' : {
            'divid' : "mls-senders",
            'column' : "senders",
            'name' : "Senders",
            'desc' : "Number of unique message senders",
            'action' : "sent"
        }
    };
    
    // http:__lists.webkit.org_pipermail_squirrelfish-dev_
    // <allura-dev.incubator.apache.org>
    function displayMLSListName(listinfo) {
        var list_name_tokens = listinfo.split("_");
        var list_name = ''; 
        if (list_name_tokens.length > 1) {
            list_name = list_name_tokens[list_name_tokens.length - 1];
            if (list_name === "")
                list_name = list_name_tokens[list_name_tokens.length - 2];
        } else {
            list_name = listinfo.replace("<", "");
            list_name = list_name.replace(">", "");
            list_name_tokens = list_name.split(".");
            list_name = list_name_tokens[0];
        }
        return list_name;
    }

    function getUserLists() {
        var form = document.getElementById('form_mls_selector');
        var lists = [];
        for ( var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].checked)
                lists.push(form.elements[i].value);
        }

        if (localStorage) {
            localStorage.setItem(getMLSId(), JSON.stringify(lists));
        }
        return lists;
    }

    function displayBasicUserAll(id, all) {
        var form = document.getElementById('form_mls_selector');
        for ( var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].type == "checkbox")
                form.elements[i].checked = all;
        }
        displayBasicUser(id);
    }

    function displayBasicUser(div_id) {

        $("#" + div_id).empty();

        lists = getUserLists();

        for ( var i = 0; i < lists.length; i++) {
            var l = lists[i];
            file_messages = self.getDataDir()+"/mls-";
            file_messages += l;
            file_messages += "-milestone0.json";
            displayBasicList(div_id, l, file_messages);
        }
    }

    function displayBasic(div_id, config_metric) {
        var lists = self.getListsData();

        lists_hide = Report.getConfig().mls_hide_lists;
        lists = lists.mailing_list;
        var user_pref = false;

        if (typeof lists === 'string')
            lists = [ lists ];

        if (localStorage) {
            if (localStorage.length && localStorage.getItem(getMLSId())) {
                lists = JSON.parse(localStorage.getItem(getMLSId()));
                user_pref = true;
            }
        }

        for ( var i = 0; i < lists.length; i++) {
            var l = lists[i];
            if (!user_pref)
                if ($.inArray(l, lists_hide) > -1)
                    continue;
            file_messages = self.getDataDir()+ "/mls-";
            file_messages += l;
            file_messages += "-milestone0.json";
            displayBasicList(div_id, l, file_messages, config_metric);
        }

    }

    // TODO: similar to displayBasicHTML in ITS and SCM. Join.
    // TODO: use cache to store mls_file and check it!
    function displayBasicList(div_id, l, mls_file, config_metric) {
        var config = Viz.checkBasicConfig(config_metric);
        for ( var id in basic_metrics) {
            var metric = basic_metrics[id];
            var title = '';
            if (config.show_title)
                title = metric.name;
            if ($.inArray(metric.column, Report.getConfig().mls_hide) > -1)
                continue;
            var new_div = "<div class='info-pill m0-box-div flotr2-"
                    + metric.column + "'>";
            new_div += "<h1>" + metric.name + " " + displayMLSListName(l)
                    + "</h1>";
            new_div += "<div id='" + metric.divid + "_" + l
                    + "' class='m0-box flotr2-" + metric.column + "'></div>";
            if (config.show_desc)
                new_div += "<p>" + metric.desc + "</p>";
            new_div += "</div>";
            $("#" + div_id).append(new_div);
            Viz.displayBasicLinesFile(metric.divid + '_' + l, mls_file,
                    metric.column, config.show_labels, title);
        }

    }

    function getReportId() {
        var project_data = Report.getProjectData();
        return project_data.date + "_" + project_data.project_name;
    }

    function getMLSId() {
        return getReportId() + "_mls_lists";
    }

    function displayEvoAggregated(id) {
        envisionEvo("Aggregated", id, self.getData());
    }

    function displayBasicMetricHTML(metric_id, div_target, show_desc) {
        Viz.displayBasicMetricHTML(basic_metrics[metric_id], self.getData(),
                div_target, show_desc);
    }

    function displayEvo(id) {
        if (localStorage) {
            if (localStorage.length && localStorage.getItem(getMLSId())) {
                lists = JSON.parse(localStorage.getItem(getMLSId()));
                return displayEvoLists(id, lists);
            }
        }

        history = self.getListsData();
        lists = history.mailing_list;
        var config = Report.getConfig();
        lists_hide = config.mls_hide_lists;
        if (typeof lists === 'string') {
            lists = [ lists ];
        }

        var filtered_lists = [];
        for ( var i = 0; i < lists.length; i++) {
            if ($.inArray(lists[i], lists_hide) == -1)
                filtered_lists.push(lists[i]);
        }

        if (localStorage) {
            if (!localStorage.getItem(getMLSId())) {
                localStorage.setItem(getMLSId(), JSON
                        .stringify(filtered_lists));
            }
        }
        displayEvoLists(id, filtered_lists);
    }
    
    function cleanLocalStorage() {
        if (localStorage) {
            if (localStorage.length && localStorage.getItem(getMLSId())) {
                localStorage.removeItem(getMLSId());
            }
        }
    }
    
    function getDefaultLists() {
        var default_lists = [];        
        var hide_lists = Report.getConfig().mls_hide_lists;
        $.each(self.getListsData().mailing_list, function(index,list) {
            if ($.inArray(list, hide_lists) === -1) default_lists.push(list);
        });
        return default_lists;
    }
    
    function displaySelectorCheckDefault() {
        var default_lists = getDefaultLists();
        
        var form = document.getElementById('form_mls_selector');
        for ( var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].type == "checkbox") {
                var id = form.elements[i].id;
                l = id.split("_check")[0];
                if ($.inArray(l, default_lists) > -1)
                    form.elements[i].checked = true;
                else form.elements[i].checked = false;
            }
        }
    }
    
    function displayBasicDefault(div_id) {
        cleanLocalStorage();
        displaySelectorCheckDefault();
        $("#" + div_id).empty();
        self.displayBasic(div_id);
    }

    function displayEvoDefault(div_id) {
        cleanLocalStorage();
        displaySelectorCheckDefault();
        $("#" + div_id).empty();
        self.displayEvo(div_id);
    }

    function displayEvoUserAll(id, all) {
        var form = document.getElementById('form_mls_selector');
        for ( var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].type == "checkbox")
                form.elements[i].checked = all;
        }
        displayEvoUser(id);
    }

    function displayEvoUser(id) {
        $("#" + id).empty();
        var lists = getUserLists();
        displayEvoLists(id, lists);
    }

    function displayEvoListSelector(div_id_sel, div_id_mls) {
        displayEvoBasicListSelector(div_id_sel, div_id_mls, null);
    }

    function displayBasicListSelector(div_id_sel, div_id_mls) {
        displayEvoBasicListSelector(div_id_sel, null, div_id_mls);
    }

    function displayEvoBasicListSelector(div_id_sel, div_id_evo, div_id_basic){
        var res1 = self.getListsData();
        var lists = res1.mailing_list;
        var user_lists = [];

        if (localStorage) {
            if (localStorage.length
                    && localStorage.getItem(getMLSId())) {
                user_lists = JSON.parse(localStorage
                        .getItem(getMLSId()));
            }
        }
        
        // Methods visible to HTML
        Report.displayBasicUser = self.displayBasicUser;
        Report.displayBasicUserAll = self.displayBasicUserAll;
        Report.displayBasicDefault = self.displayBasicDefault;
        Report.displayEvoDefault = self.displayEvoDefault;            
        Report.displayEvoUser = self.displayEvoUser;
        Report.displayEvoUserAll = self.displayEvoUserAll;

        var html = "Mailing list selector:";
        html += "<form id='form_mls_selector'>";

        if (typeof lists === 'string') {
            lists = [ lists ];
        }
        for ( var i = 0; i < lists.length; i++) {
            var l = lists[i];
            html += '<input type=checkbox name="check_list" value="'
                    + l + '" ';
            html += 'onClick="';
            if (div_id_evo)
                html += 'Report.displayEvoUser(\''
                        + div_id_evo + '\');';
            if (div_id_basic)
                html += 'Report.displayBasicUser(\''
                        + div_id_basic + '\')";';
            html += '" ';
            html += 'id="' + l + '_check" ';
            if ($.inArray(l, user_lists) > -1)
                html += 'checked ';
            html += '>';
            html += displayMLSListName(l);
            html += '<br>';
        }
        html += '<input type=button value="All" ';
        html += 'onClick="';
        if (div_id_evo)
            html += 'Report.displayEvoUserAll(\'' + div_id_evo
                    + '\',true);';
        if (div_id_basic)
            html += 'Report.displayBasicUserAll(\''
                    + div_id_basic + '\',true);';
        html += '">';
        html += '<input type=button value="None" ';
        html += 'onClick="';
        if (div_id_evo)
            html += 'Report.displayEvoUserAll(\'' + div_id_evo
                    + '\',false);';
        if (div_id_basic)
            html += 'Report.displayBasicUserAll(\''
                    + div_id_basic + '\',false);';
        html += '">';
        html += '<input type=button value="Default" ';
        html += 'onClick="';
        if (div_id_evo)
            html += 'Report.displayEvoDefault(\''+div_id_evo+'\');';
        if (div_id_basic)
            html += 'Report.displayBasicDefault(\''+div_id_basic+'\')';
        html += '">';
        html += "</form>";
        $("#" + div_id_sel).html(html);
    }

    // history values should be always arrays
    function filterHistory(history) {
        if (typeof (history.id) === "number") {
            $.each(history, function(key, value) {
                value = [ value ];
            });
        }
        return history;
    }

    function displayEvoLists(id, lists) {
        for ( var i = 0; i < lists.length; i++) {
            var l = lists[i];

            file_messages = self.getDataDir()+"/mls-";
            file_messages += l;
            file_messages += "-milestone0.json";
            displayEvoList(displayMLSListName(l), id, file_messages);
        }
    }

    function displayEvoList(list_label, id, mls_file) {
        $.getJSON(mls_file, function(history) {
            envisionEvo(list_label, id, history);
        });
    }

    function envisionEvo(list_label, div_id, history) {
        var config = Report.getConfig();

        var main_metric = "sent";
        var options = Viz.getEnvisionOptions(div_id, history, basic_metrics,
                main_metric, config.mls_hide);
        options.data.list_label = displayMLSListName(list_label);
        new envision.templates.Envision_Report(options, [ self ]);
    }
}
var aux = new MLS();
MLS.prototype = new DataSource("mls", aux.getMetrics());
Report.registerDataSource(new MLS());