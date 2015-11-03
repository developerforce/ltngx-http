({
	doInit: function(component, event, helper) {

	},
    
    handleValueChange: function(component, event, helper) {
        var auto = component.get("v.auto");
        if (auto === true) {
	        helper.exec(component, event);            
        }
    },
    
	execute: function(component, event, helper) {
        helper.exec(component, event);            
    }
 
})