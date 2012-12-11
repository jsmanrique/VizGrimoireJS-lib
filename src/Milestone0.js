/* 
 * Milestone0.js: Library for visualizing Bitergia Milestone 0 Report
 */

var M0 = {};

(function () {
	
	// M0 new public API
	M0.data_load = data_load;
	M0.data_ready = data_ready;
	M0.displayEvoSummary = displayEvoSummary;
	M0.displayEvoSummarySM = displayEvoSummarySM;
	M0.getAllMetrics = getAllMetrics;
	M0.getMarkers = getMarkers;
	M0.getConfig = getConfig;
	M0.getGridster = getGridster;
	M0.setGridster = setGridster;
	M0.getProjectData = getProjectData;
	M0.displayProjectData = displayProjectData;
	M0.displayBasicLines = displayBasicLines;
	M0.drawMetric = drawMetric;
		
	// M0 old public API
	M0.basic_lines = basic_lines;
	
	// Shared config
	var project_data = {}, markers = {}, config = {}, data_callbacks = [], gridster = {};
	
	function getMarkers() {
		return markers;
	}
	
	function getConfig() {
		return config;
	}
	
	function getGridster() {
		return gridster;
	}
	
	function setGridster(grid) {
		gridster = grid;
	}
	
	
	function getProjectData() {
		return project_data;
	}

	function data_ready(callback) {
		data_callbacks.push(callback);
	}

	function data_load(project_file, config_file, markers_file) {
		$.when($.getJSON(project_file), $.getJSON(config_file), $.getJSON(markers_file))
		.done (function(res1, res2, res3) {
			project_data = res1[0];
			config = res2[0];
			markers = res3[0];
			for (var i=0; i<data_callbacks.length; i++) {
				data_callbacks[i]();
			}
		});
	}
	
	function fillHistory(hist_complete_id, hist_partial) {
		
		// [ids, values]
		var new_history = [[],[]];
		for (var i = 0; i < hist_complete_id.length; i++) {
			pos = hist_partial[0].indexOf(hist_complete_id[i]);
			new_history[0][i] = hist_complete_id[i];
			if (pos != -1) {
				new_history[1][i] = hist_partial[1][pos];
			} else {
				new_history[1][i] = 0;
			}
		}
		return new_history;
	}
	
	function getAllMetrics() {
		var all = $.extend({}, SCM.getMetrics(), ITS.getMetrics());
		all = $.extend(all, MLS.getMetrics());
		return all;
	}
	
	function drawMetric(metric_id, divid) {		
        var config_metric = {};
        config_metric.show_desc = false;
        config_metric.show_title = false;
        config_metric.show_labels = true;
		
		var list_metrics = SCM.getMetrics();
		for (metric in list_metrics) {
			if  (list_metrics[metric].column === metric_id) {
	            SCM.displayBasicMetricHTML(list_metrics[metric].column,'data/json/scm-milestone0.json',divid, config_metric);
	            return;
			}
		}
		
		list_metrics = ITS.getMetrics();
		for (metric in list_metrics) {
			if  (list_metrics[metric].column === metric_id) {
	            ITS.displayBasicMetricHTML(list_metrics[metric].column,'data/json/its-milestone0.json',divid, config_metric);
	            return;
			}
		}
		
		list_metrics = MLS.getMetrics();
		for (metric in list_metrics) {
			if  (list_metrics[metric].column === metric_id) {
	            MLS.displayBasicMetricHTML(list_metrics[metric].column,'data/json/mls-milestone0.json',divid, config_metric);
	            return;
			}
		}		
	}
	
	function envisionEvoSummary (div_id, scm_data, its_data, mls_data) {
		var container = document.getElementById(div_id);
		
		
		var full_history_id = [], dates = [];
		
		if (scm_data) {
			full_history_id = scm_data.id;
			dates = scm_data.date;
		} 
		if (its_data && its_data.id.length>full_history_id.length) {			
			full_history_id = its_data.id;
			dates = its_data.date;
		}
		if (mls_data && mls_data.id.length>full_history_id.length)  {
			full_history_id = mls_data.id;
			dates = mls_data.date;
		}
		
		markers = getMarkers();
		
		var V = envision,  options, vis, 
			firstMonth = full_history_id[0];
		
		options = {
			container : container,
			xTickFormatter : function(index) {
				var label = dates[index - firstMonth];
				if (label === "0") label = "";
				return label;
			},
			yTickFormatter : function(n) {
				return n + '';
			},
			// Initial selection
			selection : {
				data : {
					x : {
						min : full_history_id[0],
						max : full_history_id[full_history_id.length - 1]
					}
				}
			}
		};

		var main_metric = "", main_matric_data = [];
		if (scm_data) {
			main_metric = "commits";
			main_matric_data = scm_data[main_metric];
		}
		else if (its_data) {
			main_metric = "opened";
			main_matric_data = its_data[main_metric];
		}
		else if (mls_data) {
			main_metric = "sent";
			main_matric_data = mls_data[main_metric];
		} else {
			alert('No data for Summary viz');
		}
			
		
		var hide = getConfig().summary_hide;
		options.data = {
				summary : [full_history_id, main_matric_data],
				markers : markers,
				dates : dates,
				envision_hide: hide,
				main_metric: main_metric		
		};
		
		var all_metrics = {}, data_sources = [];
		if (scm_data) {all_metrics = $.extend(all_metrics, SCM.getMetrics());data_sources.push('scm');}
		if (its_data) {all_metrics = $.extend(all_metrics, ITS.getMetrics());data_sources.push('its');}
		if (mls_data) {all_metrics = $.extend(all_metrics, MLS.getMetrics());data_sources.push('mls');}
				
		for (var id in all_metrics) {
			if (scm_data && scm_data[id])
				options.data[id] = fillHistory(full_history_id,[scm_data.id, scm_data[id]]);
			else if (its_data && its_data[id])
				options.data[id] = fillHistory(full_history_id,[its_data.id, its_data[id]]);
			else if (mls_data && mls_data[id])
				options.data[id] = fillHistory(full_history_id,[mls_data.id, mls_data[id]]);
		}
		
		options.trackFormatter = function(o) {
			var data = o.series.data, index = data[o.index][0]- firstMonth, value;

			value = dates[index] + ":<br>";
			
			var i = 0;
			for (var id in all_metrics) {
				value += options.data[id][1][index] + " " + id + ", ";
				if (++i % 3 == 0) value += "<br>";
			}

			return value;
		};
	
		// Create the TimeSeries
		vis = new envision.templates.Envision_Milestone0(options, data_sources);
	}

	function displayEvoSummarySM(id, commits, messages) {	
		$.when($.getJSON(commits), $.getJSON(messages))
		.done (function(res1, res3) {			
			envisionEvoSummary (id, res1[0], null, res3[0]);
		});
	}

	
	function displayEvoSummary(id, commits, issues, messages) {	
		$.when($.getJSON(commits), $.getJSON(issues), $.getJSON(messages))
		.done (function(res1, res2, res3) {			
			envisionEvoSummary (id, res1[0], res2[0], res3[0]);
		});
	}
	
	function basic_lines(div_id, json_file, column, labels, title) {
		$.getJSON(json_file, function(history) {
			displayBasicLines (div_id, history, column, labels, title);
		});
	}
	
			
	function displayBasicLines (div_id, history, column, labels, title) {
		var line_data = [];
		container = document.getElementById(div_id);
		
		// if ($('#'+div_id).is (':visible')) return;

		for ( var i = 0; i < history[column].length; i++) {
			line_data[i] = [ i, parseInt(history[column][i]) ];
		}
		
		var config = {
				title : title,
				xaxis : {
					minorTickFreq : 4,
					tickFormatter : function(x) {
						if (history.date) {
							x = history.date[parseInt(x)];
						}
						return x;
					}
				},
				yaxis : {
					minorTickFreq : 1000,
					tickFormatter : function(y) {
						return parseInt(y) + "";
					}
				},

				grid : {
					show : false,
				// minorVerticalLines: true
				},
				mouse : {
					track : true,
					trackY : false,
					trackFormatter : function(o) {
						return history.date[parseInt(o.x)] + ": "
								+ parseInt(o.y);
					}
				}
		};

		if (!labels || labels==0) {
			config.xaxis.showLabels = false;
			config.yaxis.showLabels = false;
		}
		graph = Flotr.draw(container, [ line_data ], config);
	};
	
	function displayProjectData() {
		data = project_data;
		document.title = data.project_name + ' M0 Report by Bitergia';
		$(".report_date").text(data.date);
		$(".project_name").text(data.project_name);
		$("#project_url").attr("href", data.project_url);
		$('#scm_type').text('git');
		$('#scm_url').attr("href", data.scm_url);
		$('#scm_name').text(data.scm_name);
		$('#its_type').text(data.its_type);
		$('#its_url').attr("href", data.its_url);
		$('#its_name').text(data.its_name);
		$('#mls_type').text(data.mls_type);
		$('#mls_url').attr("href", data.mls_url);
		$('#mls_name').text(data.mls_name);
		var str = data.scm_url;
		if (!str || str.length === 0) {
			$('.source_info').hide();
		}
		var str = data.its_url;
		if (!str || str.length === 0) {
			$('.tickets_info').hide();
		}
		var str = data.mls_url;
		if (!str || str.length === 0) {
			$('.mls_info').hide();
		}
		var str = data.blog_url;
		if (str && str.length > 0) {
			$('#blogEntry').html(
					"<br><a href='" + str
							+ "'>Blog post with some more details</a>");
			$('.blog_url').attr("href", data.blog_url);
		} else {
			$('#more_info').hide();
		}
		str = data.producer;
		if (str && str.length > 0) {
			$('#producer').html(str);
		} else {
			$('#producer').html("<a href='http://bitergia.com'>Bitergia</a>");
		}
	} 
})();