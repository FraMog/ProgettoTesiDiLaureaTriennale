/*
 * Documento che si occupa della disposizone di tutti gli elementi della pagina (inclusi gli annunci) quando si passa
 * in modalità fullscreen
 */

//Variabile che mi serve per comunicare tra document javascript (questo e ads.js) se il documento è attualmente
//mostrato in modalità fullscreen oppure no
var fullScreenBoolean = false;




//Salvo per un back-up il CSS del videoPlayer e del main, che successivamente modifichero, per poterlo reimpostare quando mi servira
//a quello originale: ad esempio se inizialmente il mainContainer dovessero occupare una specifica posizone nel documento (x,y), una
//volta che mostro il tutto fullscreen ovviamente avranno posizione (0,0) : dopo, uscito dal fullscreen, dovrò ripristinare il css iniziale
var videoStyle = document.getElementById('contentElement').style;
var mainContainerStyle = document.getElementById('mainContainer').style;


//Variabili che mi servono per salvarmi del video player (che sono le stesse del mainContainer) che vengono modificate tra modalità fullscreen e non (in fondo al documento)
//Tutto ciò mi serve per poter calcolare le nuove posizioni e size, in proporzione, di tutti gli annunci quando si passa entra/esce da modalità fullscreen
var oldVideoPlayerWidth, oldVideoPlayerHeight;
//Variabile che mi aiuta a stabilire se so uscendo dal fullscreen per via del bottone ESC. In tal caso devo aggiornare le dimensioni
//del video player, che non sono state aggiornate
var videoPlayerSizeModified=false;

//variabile che mi serve a stabilire se esco dal fullscreen perché ci sono entrato con un fullscreenElement!=#mainContainer (ad esempio cioè con il video player)
var enteringFullScreenWithoutMainContainer=false;
//Funzione callback che viene chiamata ogni qual volta si passa da modalità non fullscreen a fullscreen e viceversa
function fullScreenChange(mode){

	//Controllo se il documento è attualmente mostrato a schermo intero
	var isFullScreen = document.fullScreen || 
	document.mozFullScreen || 
	document.webkitIsFullScreen;

	//Se questo elemento è !=null significa che sto entrando in modalità fullscreen, altrimenti se ==null allora sto uscendo dal fullscreen

	var fullScreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitFullscreenElement;



	//Se sto entrando in modalità fullscreen
	if(fullScreenElement) {
		//per prima cosa controllo che non sono gia in modalità fullscreen (perché si può cliccare su firefox sul
		//video player per mandarlo in fullscreen anche se un altra parte del documento è gia in fullscreen 
		if (fullScreenBoolean){
			var exitFullscreen= document.exitFullscreen ||	document.webkitExitFullscreen ||	document.mozCancelFullScreen ||	document.msExitFullscreen  || 	webkitExitFullscreen  || 	document.webkitExitFullscreen();
			if(exitFullscreen){
				//Pur di non entrare in un fullscreen (è il browser di default a farmici entrare e non si può disabilitare
				//questo comportamento) dove viene mostrato solo il video player senza nemmeno un annuncio scelgo, ed è l'unica opzione possibile se si vuole evitare ciò,
				//di uscire da tutto il fullscreen
				exitFullscreen.call(document);
				return;
			}		
		}
		//A questo punto contollo che non stia cercando di entrare in fullscreen con un elemento diverso da mainContainer 
		//ma stavolta quando il documento non è ancora in modalità fullscreen con mainContainer
		if(fullScreenElement!=document.getElementById("mainContainer")){
			var exitFullscreen= document.exitFullscreen ||	document.webkitExitFullscreen ||	document.mozCancelFullScreen ||	document.msExitFullscreen  || 	webkitExitFullscreen  || 	document.webkitExitFullscreen();
			if(exitFullscreen){
				enteringFullScreenWithoutMainContainer=true;
				exitFullscreen.call(document);
				return;
			}
		}
		//Modifico le posizioni del mainContainer  e del videoPLayer adattandole allo schermo dell'utente
		$("#contentElement").css("width", window.screen.width + "px");
		$("#contentElement").css("height", window.screen.height + "px");
		$("#mainContainer").css("width", window.screen.width + "px");
		$("#mainContainer").css("height", window.screen.height + "px");
		$("#mainContainer").css("margin", "0px");
		fullScreenBoolean=true;
		var fullScreenElement2 = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitFullscreenElement;

		if (adsManager){

			if(ads!=null){
				var q;
				for (q=0; q<ads.length; q++){
					//Modifico la size (e anche la posizione) di tutti gli ads presenti attualmente
					resizeAndRepositionAds("toFullscreen", q, oldVideoPlayerWidth, oldVideoPlayerHeight, 	$("#mainContainer").css("width").match(/\d/g).join(""), $("#mainContainer").css("height").match(/\d/g).join(""));

				}
			}
		}

		
	}
	else{

		//Per prima cosa controllo se sto uscendo dal fullscreen perché ho tentato di entrarci con un elemento
		//!=#mainContainer
		if(enteringFullScreenWithoutMainContainer){
			enteringFullScreenWithoutMainContainer=false;
			fullScreenBoolean=false;
			videoPlayerSizeModified=false;
			return; //Faccio return perché l'unica possibilità che ho per arrivare qui è che io abbia fatto
			/*doppio click sul video player quando non ero in modalità fullscreen,perché se lo avessi fatto quando
			 * ero in modalità fullscreen sarei gia uscito nel controllo  nella funzione: 
			 */
		}

		//Se questa variabile è false significa che questa funzione è stata chiamata non per via della funzione di callback	$("#fullscreenButton").on("click",function()
		//dopo click sul bottone ma per via del bottone ESC della tastiera, dunque le dimensioni oldVideoPlayer non sono state ancora aggiornate
		if(!videoPlayerSizeModified){
			oldVideoPlayerWidth =  window.screen.width;
			oldVideoPlayerHeight=  window.screen.height;
		}
		//Ripristino le dimensioni dei vari elementi
		$("#contentElement").css("width", "640px");
		$("#contentElement").css("height", "360px");
		$("#mainContainer").css("width", "640px");
		$("#mainContainer").css("height", "360px");
		fullScreenBoolean=false;
		if (adsManager){

			if(ads!=null){

				var q;

				for (q=0; q<ads.length; q++){

					//Ripristino le posizioni e le dimensioni dei vari annunci
					resizeAndRepositionAds("exitFullScreen", q, oldVideoPlayerWidth, oldVideoPlayerHeight, 	$("#mainContainer").css("width").match(/\d/g).join(""), $("#mainContainer").css("height").match(/\d/g).join(""));			}
			}


		}
		//Ripristino lo stile del contentElement a quello originale
		document.getElementById('contentElement').style=videoStyle;
		document.getElementById('mainContainer').style=mainContainerStyle;

		



	}
	videoPlayerSizeModified=false;

}




/*Funzione che mi fa da proxy per la funzione che modifica la size degli annunci e invoca anche la funzione per la modifica della posizione.
 * Entrambe le cose sono fatte sia quando si entra che quando si esce dal fullscreen.
 * Mode := modalità che serve per distiguere se sto uscendo o entrando nel fullscreen 
 * q := indice dell'annuncio
 * oldVideoPlayerWidth, oldVideoPlayerHeight := le vecchie dimensioni del player, prima che si cambiasse modalità
 * newVideoPlayerWidth, newVideoPlayerHeight:= le nuove dimensioni del player
 *
 */
function resizeAndRepositionAds(mode, q, oldVideoPlayerWidth, oldVideoPlayerHeight,newVideoPlayerWidth , newVideoPlayerHeight){
	//alertq);
	var divAnnuncio = document.getElementById('companion-ad' + q);
	var ad = ads[q];
	if(divAnnuncio!=null && divAnnuncio.innerHTML!=""){

		//Se l'ad è ad esempio un immagine o <div><img src"url"> 

		var url= divAnnuncio.firstChild.src;

		//Se l'ad è ad esempio un video o audio ho <div><video><source src="url">
		if(url==null){
			var url= divAnnuncio.firstChild.firstChild.src;
		}

		//Nel caso in cui l'annuncio sia nel frattempo finito l'url comunque sarebbe null, dunque devo fare anche questo controllo
		if(url!=null){
			var urlType = url.substr(url.lastIndexOf('.') + 1);
			if ("toFullscreen"== mode )
				modificaSizeAnnuncio(divAnnuncio.firstChild,  urlType, ad.getWidth() * window.screen.width/640, ad.getHeight() * window.screen.height/360);
			else if ("exitFullScreen" == mode ) modificaSizeAnnuncio(divAnnuncio.firstChild,  urlType, ad.getWidth(), ad.getHeight());
			modificaPosAnnuncio(divAnnuncio, newVideoPlayerHeight,oldVideoPlayerHeight,  newVideoPlayerWidth, oldVideoPlayerWidth);
		}

	}
}


//Funzione che modifica la posizione dell'annuncio, secondo i parametri passati in input

function modificaPosAnnuncio(divAnnuncio, newVideoPlayerHeight,oldVideoPlayerHeight,  newVideoPlayerWidth, oldVideoPlayerWidth){
	if(divAnnuncio.style.top!="")
		divAnnuncio.style.top= divAnnuncio.style.top.match(/\d\.?/g).join("") * newVideoPlayerHeight/oldVideoPlayerHeight  +"px";
	if(divAnnuncio.style.left!="")
		divAnnuncio.style.left= divAnnuncio.style.left.match(/\d\.?/g).join("") * newVideoPlayerWidth / oldVideoPlayerWidth + "px";
}


/*
 * Funzione che modifica la size dell'annuncio, secondo i parametri passati in input.
 * Non per tutti gli annunci è necassaria modificare la size: infatti per quelli di tipo audio, che non hanno
 * dimensione fisica sullo schermo, non è necessario
 */
function modificaSizeAnnuncio(firstChild,  urlType, newWidth, newHeight){
	switch (urlType){
	case "mp3": 
	case "wav": 
	case "ogg": {

		break;
	}

	case "jpg": 
	case "png":
	case "gif":
	case "bmp":
	case "mp4":
	default:
	{

		firstChild.width=newWidth;
		firstChild.height=newHeight;
		break;

	}


	}
}

$(document).ready(function(){

	/*
	 * Al click sul #fullscreenButton verifico se gia sto in modalità fullscreen o meno 
	 */
	$("#fullscreenButton").on("click",function(){
		var isFullScreen = document.fullScreen || 
		document.mozFullScreen || 
		document.webkitIsFullScreen;

		//Mi salvo le attuali dimensioni del video player (che sono le stesse del mainContainer) che tra poco modificherò:
		//Tutto ciò mi serve per poi poter calcolare in proporzioni le nuove posizioni e size dei vari annunci 
		oldVideoPlayerWidth =  $("#mainContainer").css("width").match(/\d/g).join("");
		oldVideoPlayerHeight=  $("#mainContainer").css("height").match(/\d/g).join("");
		videoPlayerSizeModified=true;
		//Se questo elemento è !=null significa che sto entrando in modalità fullscreen, altrimenti se ==null allora sto uscendo dal fullscreen
		var fullScreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitFullscreenElement;
		if(!fullScreenElement) {
			//Entro nel fullscreen document.documentElement

			var requestFullScreen  = document.getElementById("mainContainer").requestFullscreen ||
			document.getElementById("mainContainer").webkitRequestFullscreen ||
			document.getElementById("mainContainer").mozRequestFullscreen ||
			document.getElementById("mainContainer").requestFullScreen ||
			document.getElementById("mainContainer").webkitRequestFullScreen ||
			document.getElementById("mainContainer").mozRequestFullScreen;
			requestFullScreen.call(document.getElementById("mainContainer"));
			//ORA SI ATTIVA L'EVENTO  e parte la callback (onfullscreenChange)

			return;
		}
		else {
			var exitFullscreen= document.exitFullscreen ||	document.webkitExitFullscreen ||	document.mozCancelFullScreen ||	document.msExitFullscreen  || 	webkitExitFullscreen  || 	document.webkitExitFullscreen();
			if(exitFullscreen){
				exitFullscreen.call(document);return;
			}
			//ORA SI ATTIVA L'EVENTO  e parte la callback (onfullscreenChange)
		}

	}); 


});

/*
 * Registro la callback per il fullscreenChange 
 */
$(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',function(){
	fullScreenChange();

});
