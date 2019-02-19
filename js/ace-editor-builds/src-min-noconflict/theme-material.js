ace.define("ace/theme/material",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-material";
exports.cssText = ".ace-material .ace_gutter {\
	background: #253238;\
	color: #747C8F;\
	overflow: hidden;\
}\
.ace-material .ace_print-margin {\
width: 1px;\
background: #3A4950;\
}\
.ace-material {\
background-color: #253238;\
color: #A5DBD8;\
font-size:14px;\
line-height: 24px;\
}\
.ace-material .ace_identifier {\
color: white;\
}\
.ace-material .ace_keyword {\
color: #C88FEC;\
}\
.ace-material .ace_numeric {\
color: black;\
}\
.ace-material .ace_storage {\
color: #11B7BE;\
}\
.ace-material .ace_keyword.ace_operator,\
.ace-material .ace_lparen,\
.ace-material .ace_rparen,\
.ace-material .ace_punctuation {\
color: #C7CDD7;\
}\
.ace-material .ace_set.ace_statement {\
color: #0000FF;\
text-decoration: underline;\
}\
.ace-material .ace_cursor {\
color: #FFCD00;\
}\
.ace-material .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-material .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-material .ace_constant.ace_language {\
color: #F97565;\
}\
.ace-material .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-material .ace_invalid {\
background-color: rgb(153, 0, 0);\
color: white;\
}\
.ace-material .ace_support.ace_function {\
color: #86DDFF;\
}\
.ace-material .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-material .ace_class {\
color: #FFCC63;\
}\
.ace-material .ace_support.ace_other {\
color: #6D79DE;\
}\
.ace-material .ace_variable.ace_parameter {\
font-style: italic;\
color: #B1CCD7;\
}\
.ace-material .ace_comment {\
color: #536E7B;\
}\
.ace-material .ace_constant.ace_numeric {\
color: white;\
}\
.ace-material .ace_variable {\
color: #B1CCD7;\
}\
.ace-material .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-material .ace_support.ace_storedprocedure {\
color: #800000;\
}\
.ace-material .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-material .ace_list {\
color: rgb(185, 6, 144);\
}\
.ace-material .ace_marker-layer .ace_selection {\
background: #304549;\
border: 1px solid #506B7A;\
}\
.ace-material .ace_marker-layer .ace_step {\
background: green;\
}\
.ace-material .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-material .ace_marker-layer .ace_bracket {\
margin: 0 2px 0 0;\
border-bottom:1px solid #B49700;\
border-radius:0;\
// border: 1px solid rgb(192, 192, 192);\
}\
.ace-material .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-material .ace_gutter-active-line {\
background-color: #222F35;\
}\
.ace-material .ace_marker-layer .ace_selected-word {\
background: transparent;\
border: 1px solid #C9A600;\
border-radius: 2px;\
}\
.ace-material .ace_meta.ace_tag {\
color: #D54238;\
}\
.ace-material .ace_string.ace_regex {\
color: #FF0000;\
}\
.ace-material .ace_string {\
color: #C2E988;\
}\
.ace-material .ace_entity.ace_other.ace_attribute-name {\
color: #FFCC63;\
}\
.ace-material .ace_indent-guide {\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
