KindEditor.plugin("imgresize",function(e){if(!e.IE){var i=this;i.isCreated?n():i.afterCreate(n)}function n(){var n=i.cmd.doc;if(!e._WEBKIT)return n.execCommand("enableObjectResizing"),void n.execCommand("enableInlineTableEditing")}});