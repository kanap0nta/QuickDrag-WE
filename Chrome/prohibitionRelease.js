(function(func){
	window.addEventListener('load', function() {
		var script = document.createElement("script");
		script.textContent = "(" + func.toString() + ")()";
		document.body.appendChild(script);
	}, false);
})(function(){
	function prohibitation_release(doc) {
		var f = function(){ return true; };
		doc.onmousedown = f();
		doc.onmouseup = f();
		doc.onclick = f();
		doc.oncontextmenu = f();
		doc.ondragstart = f();
		doc.ondragover = f();
		doc.ondragend = f();
		doc.ondrop = f();
		doc.onselectstart = f();
		doc.onbeforecopy = f();
		doc.onbeforecut = f();
		doc.oncopy = f();
		doc.onpaste = f();
		doc.oncut = f();
		if(typeof doc.style !== 'undefined'){
			doc.style.userSelect = "auto";
			doc.style.MozUserSelect = "auto";
			doc.style.MsUserSelect = "auto";
			doc.style.WebkitUserSelect = "auto";
			doc.style.pointerEvents = "auto";
		}
	}
	prohibitation_release(document);
	for(var i = 0; i < document.all.length; i++){
		prohibitation_release(document.all[i]);
	}
	if(typeof jQuery !== 'undefined'){
		jQuery("*").off("mousedown mouseup click contextmenu dragstart dragover dragend drop selectstart beforecopy beforecut copy paste cut");
	}
})