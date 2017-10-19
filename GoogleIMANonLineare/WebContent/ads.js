var LINEAR_SLOT_WIDTH = 640;
var LINEAR_SLOT_HEIGHT= 360;
var NON_LINEAR_SLOT_WIDTH = 400;
var NON_LINEAR_SLOT_HEIGHT= 200;
//Variabile che tiene conto del numero di annunci presenti
var adIndex=0;
/*Variabile che tiene conto di quante volta i companion index siano stati letti con successo tra VAST responses diverse
 */
var numeroVASTResponsesLette=-1;
//Tempo dopo il quale gli annunci nonlineari di tipo image devono essere nascosti
var STANDARD_MILLISECONDS_TIMEOUT=10000;
//Array contente tutti i companion ads;
var ads = [];
/*Variabile nel quale registrerò gli attributi "offset" del tag AdBreak di VMAP, contente gli offset di tutte le VAST Responses, 
 * che mi saranno utili per registrare gli "starting time" di ogni annuncio
 */
var annunciVMAPOffset;
var adsManager;

/*Array che presenta un item per ogni NonLinearAd: ogni chiave sarà l'Id del tag <Id> (che sarà lo stesso valore del rispettivo <Ad>
 * ogni valore sarà composto da una struttura contenente la coppia di valori per l'annuncio non Lineare ed un array ordinato in base all'ordine 
 * nel quale i companion vengono inseriti nella sintassi del file Positioning.xml contenente le coppie di posizioni (x,y) per tutti i companion
 */
var positions = {};

/* Array composto da AdsDescriber che è l'oggetto (con costruttore in fondo a questo documento) che mi registra le informazioni
 * degli annunci 
 */
var adsDescribers=[]; 
//Il container degli annunci
var divContainer = document.getElementById('adContainer');
//Style usato per il back-up
var nonLinearStyle = document.getElementById('adContainer').style;
//Creo un ad display container

//Recupero l'element content del video
var videoContent = document.getElementById('contentElement');
//Recupero il containe dell'ads e gli passo anche il content.
//Un iframe è creato qui dentro per mostrare l'annuncio
var adDisplayContainer =
	new google.ima.AdDisplayContainer(
			divContainer,
			videoContent);
//Inizializazo il container
adDisplayContainer.initialize();



/*Request ads
Inizializzo l'ads Loader passandogli adDisplayContainer inizializzato sopra
 */
var adsLoader = new google.ima.AdsLoader(adDisplayContainer);

//Add event listeners per il caricatore dell'ads sia in caso di successo che
//di fallimento
adsLoader.addEventListener(
		google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
		onAdsManagerLoaded,
		false);
adsLoader.addEventListener(
		google.ima.AdErrorEvent.Type.AD_ERROR,
		onAdError,
		false);


function onAdError(adErrorEvent) {
	// Distruggo l'AdsManager
	adsManager.destroy();
}




//Request video ads.
//I video da richiedere per gli annunci
var adsRequest = new google.ima.AdsRequest();
/*Spiegazione del tag che è un url utilizzato dal player per recuperare
 * gli annunci video
 * https://support.google.com/dfp_premium/answer/1068325
 */

//DEVE ESSERE HTTPS ALTRIMENTI GOOGLE IMA SDK NON LO LEGGE!
adsRequest.adTagUrl = 'https://localhost:8443/HTTPSServer/VmapTest.xml';


//Funzioni per richiedere l'XML con le posizioni
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		// Typical action to be performed when the document is ready:
		//Parsing dal documento sotto forma di stringa

		parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xhttp.responseText, "text/xml");
		var annunciNonLineari = xmlDoc.getElementsByTagName("NonLinearAd");
		var indice;
		for(indice=0; indice<annunciNonLineari.length; indice++){
			var iesimoNonLineareTag=annunciNonLineari[indice];
			//Creo la struttura che deve avere un hashMap con la posizione del non lineare e l'array dei companions
			var iesimoItem = {};
			//E la aggiungo alla map avendo come chiave l'Id
			var key = iesimoNonLineareTag.getElementsByTagName("Id")[0].childNodes[0].nodeValue;
			//alert(key);
			positions[key]= iesimoItem ;

			//Creo l'oggetto che deve avere al suo interno le dimensioni del nonlineare e la aggiungo alla struttura precedente
			var posizioneNonLineare={};
			iesimoItem["posizioneNonLineare"]=posizioneNonLineare;
			//E la popolo con le dimensioni opportune
			posizioneNonLineare["positionX"]= iesimoNonLineareTag.getElementsByTagName("positionX")[0].childNodes[0].nodeValue;
			posizioneNonLineare["positionY"]= iesimoNonLineareTag.getElementsByTagName("positionY")[0].childNodes[0].nodeValue;

			//Creo l'oggetto che deve essere l'array contenente la posizione di tutti i companion relativi all'annuncio nonLineare
			//e lo aggiungo alla struttura precedente
			var arrayDellePosizioniDeiCompanion=[];

			iesimoItem["arrayDellePosizioniDeiCompanion"]=arrayDellePosizioniDeiCompanion;
			//Considero tutti i companionVontenuti 
			var companionAdsPerQuestoNonLinear=iesimoNonLineareTag.getElementsByTagName("CompanionAd");
			var indice2;
			for (indice2=0; indice2<companionAdsPerQuestoNonLinear.length;indice2++){
				companionAdIesimo=companionAdsPerQuestoNonLinear[indice2];
				//Creo l'oggetto dove inserire le dimensioni del iesimo2 companion e lo aggiungo all'array
				var posizioneDelIesimo2Companion={};
				arrayDellePosizioniDeiCompanion[indice2]=posizioneDelIesimo2Companion;
				posizioneDelIesimo2Companion["positionX"]= companionAdIesimo.getElementsByTagName("positionX")[0].childNodes[0].nodeValue;
				posizioneDelIesimo2Companion["positionY"]= companionAdIesimo.getElementsByTagName("positionY")[0].childNodes[0].nodeValue;
			}


		}
		
	}
};
xhttp.open("GET", "https://localhost:8443/HTTPSServer/Positioning.xml", true);
xhttp.send();




//Slot sizes per gli annunci lineari e non lineari
adsRequest.linearAdSlotWidth = LINEAR_SLOT_WIDTH;
adsRequest.linearAdSlotHeight = LINEAR_SLOT_HEIGHT;
adsRequest.nonLinearAdSlotWidth =  NON_LINEAR_SLOT_WIDTH;
adsRequest.nonLinearAdSlotHeight = NON_LINEAR_SLOT_HEIGHT;




//Variabile aggiunta per essere sicuri che venga effettuata un unica adsRequest all'TagUri indicato (per non mostrare più volte lo stesso annuncio)
var numeroAdsRequestEffettuate=0;
videoContent.onplay= function(){
	//Se è la prima volta che metto in play effettuo la request per gli annunci (per la VMAP E LE VAST Responses)
	if (numeroAdsRequestEffettuate==0){
		//requestAds();
		videoContent.pause();
		numeroAdsRequestEffettuate++;
		return;
	}else {
		/*Se non è la prima volta che metto in play allora vuol dire che sono giunto qui perché avevo precedentemente messo
		 *in pausa il video content ed ora l'ho resumato
		 */
//		Faccio ripartire quando riparte il video base anche tutti i companion di tipo video 
		var currentCompanionVideoTag= $("div#adDivsContainer video");
		var iterator;
		for (iterator=0; iterator<currentCompanionVideoTag.length; iterator++){
			currentCompanionVideoTag[iterator].play();
		}


//		Faccio ripartire quando riparte il video base anche tutti i companion di tipo audio
		var currentCompanionAudioTag= $("div#adDivsContainer audio");
		for (iterator=0; iterator<currentCompanionAudioTag.length; iterator++)
			currentCompanionAudioTag[iterator].play();



	}


}


//Listener utile nel caso degli annunci lineari per comunicare all'SDK che il video è terminato ed 
/*Pongo:
 * 2) adsLoader.contentComplete(); Istruzione di default di IMA, deve esserci per forza
 */
var contentEndedListener = function() {  adsLoader.contentComplete();};
videoContent.onended = contentEndedListener;


/*Funzione che mi controlla il flusso del tempo nel video player per stabilire quando mostrare gli annunci, secondo quanto
 * stabilito nelle VMAP E VAST Responses (timeOffset e minSuggestedDuration):
 * Cosi stabilisco per ogni annuncio, seguendo il flusso del tempo del video base, quando mostrarlo e quando nasconderlo
 * e nel caso di annunci di tipo video e audio anche a che punto l'annuncio video o audio devono stare: ad esempio se ho un 
 * annuncio di tipo video di 21 secondi da mostrare tra il secondo 5 e il secondo 26 del video base, supponendo che il video base parta
 * al secondo 11: allora il video-annuncio dovrà avere come proprio current time non 0 (ossia non deve partire dall'inizio)
 * ma 11-5=6 
 */
videoContent.ontimeupdate = function() {
	//Variabile che mi scorre tutti gli annunci presenti sino ad ora
	var index =0;

	//Seleziono solo gli annunci che sono gia iniziati
	while(index < adsDescribers.length && adsDescribers[index].getMillisecondStartShowing()<=(videoContent.currentTime * 1000)){
		//Se non è ancora finito lo mostro
		if(adsDescribers[index].getMillisecondEndShowing()>= (videoContent.currentTime * 1000)){
			var urlType = adsDescribers[index].getUrlType();
			//Se è un annuncio di tipo audio o video lo mostro
			if(urlType=="mp3" || urlType=="mp4" || urlType=="ogg" || urlType=="mp3" || urlType=="wav"){
				/*
				 * faccio tutto ciò se e solo se l'annuncio NON era GIA MOSTRATO (tramite la clausola if)
				 * (ossia se nel precedente quanto di tempo NON ERO nell'intervallo sono nel intervallo [startingTime, endTime]
				 */
				if($(adsDescribers[index].getDivCompanion()).css("display")=="none"){
					$(adsDescribers[index].getDivCompanion()).css("display","block");
					//Nel caso in video base non sia in paused faccio ripartire il contenuto
					if(!videoContent.paused){
						adsDescribers[index].getFirstDivChild().play();
					}
					//Inoltre stabilisco il tempo per cui mostrare l'annuncio = al tempo rimanente alla risorsa multimediale per essere mostrata
					var subtract = (videoContent.currentTime * 1000) - adsDescribers[index].getMillisecondStartShowing();
					adsDescribers[index].getFirstDivChild().currentTime = ((videoContent.currentTime * 1000) - adsDescribers[index].getMillisecondStartShowing())/1000;


				}

			}else {//Altrimenti, se non è un annuncio di tipo audio o video, lo mostro semplicemente
				$(adsDescribers[index].getDivCompanion()).css('display', 'block');
			}

		}
		//Quelli che sono iniziati e gia finiti, li nascondo
		else {
			$(adsDescribers[index].getDivCompanion()).css('display', 'none');
		}

		index++;
	}

	// Quelli non ancora iniziati li nascondo
	while(index < adsDescribers.length){
		$(adsDescribers[index].getDivCompanion()).css('display', 'none');
		index++;
	}
};


/*Funzione chiamata quando l'user clicca sulla progress bar del video player: mi serve nel caso SONO GIA nell'intervallo
[startingTime, endTime] di un annuncio di tipo audio o video, cambio posizione nel video Content (onseeked) e rimango 
però nell'intervallo [startingTime, endTime] di tale annuncio: a questo punto devo aggiornare solo il currentTime
di tale annuncio (in quanto ho cambiato la mia posizione rimanendo comunque nell'intervallo, quindi deve essere ancora mostrata
solo, che avendo cambiato la posizione nel video base, devo cambiare anche quella dell'annuncio per mantenerla coerente
 */
videoContent.onseeked = function() {
	var index =0;
	//Seleziono solo gli ads companion che sono gia iniziati
	while(index < adsDescribers.length && adsDescribers[index].getMillisecondStartShowing()<=(videoContent.currentTime * 1000)){
		var urlType = adsDescribers[index].getUrlType();
		if(urlType=="mp3" || urlType=="mp4" || urlType=="ogg" || urlType=="mp3" || urlType=="wav"){
			if(adsDescribers[index].getMillisecondEndShowing()>= (videoContent.currentTime * 1000)){
				adsDescribers[index].getFirstDivChild().currentTime = ((videoContent.currentTime * 1000) - adsDescribers[index].getMillisecondStartShowing())/1000;
				$(adsDescribers[index].getDivCompanion()).css("display","block");
			}
		}
		//I restanti, che sono gia finiti, li nascondo
		index++;
	}

};





function requestAds() {
	//AdsRequest definita sopra, sono gli annunci da richiedere
	adsLoader.requestAds(adsRequest);

}





//Ottengo l'adsManager e mostro gli annunci

//In caso di successo di caricamento del video
function onAdsManagerLoaded(adsManagerLoadedEvent) {
//	================================================================================================//
//	================================================================================================//
//	Parte per modificare le impostazioni di rendering degli ads di default 	 
	//Modifico il rendering di default, non mostrando l'annuncio al centro

	var adsRenderingSettings = new google.ima.AdsRenderingSettings();


	adsRenderingSettings.autoAlign = false;
	adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
	adsRenderingSettings.enablePreloading = true;

	adsManager = adsManagerLoadedEvent.getAdsManager(videoContent,adsRenderingSettings);

	annunciVMAPOffset= adsManager.getCuePoints();

	/*
	 * Funzione attivata quando metto in pausa il video base
	 */
	videoContent.onpause=function(){
		//Questa istruzione va lasciata se si stanno per mostrare annunci non lineari 
		//(anche se non funziona perché il suo scopo dovrebbe essere di mettere in pausa anche l'annuncio se 
		//il video base è in pausa ma non funziona, quanto meno non funziona per Static Resources)
		//mentre per annunci lineari va cancellata (meglio resa commento)
		adsManager.pause();

//		Se metto in pausa il video base devo mettere in pausa anche tutti gli annunci di tipo audio o video
		var iterator;
		//Metto in pausa quando metto in pausa il video base anche tutti i companion di tipo audio
		var currentCompanionAudioTag= $("div#adDivsContainer audio");

		for (iterator=0; iterator<currentCompanionAudioTag.length; iterator++)
			currentCompanionAudioTag[iterator].pause();

		//Metto in pausa quando metto in pausa il video base anche tutti i companion di tipo video
		var currentCompanVideoTag= $("div#adDivsContainer video");
		//////alert"currentCompanVideoTag " + currentCompanVideoTag.length);
		for (iterator=0; iterator<currentCompanVideoTag.length; iterator++){
			currentCompanVideoTag[iterator].pause(); 

		}




	};





	//Listeners di default per gli eventi
	adsManager.addEventListener(
			google.ima.AdErrorEvent.Type.AD_ERROR,
			onAdError);
	adsManager.addEventListener(
			google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			onContentPauseRequested);
	adsManager.addEventListener(
			google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
			onContentResumeRequested);


	adsManager.addEventListener(
			google.ima.AdEvent.Type.COMPLETE,
			function(){
				adsManager.destroy();
			});

	adsManager.addEventListener(
			google.ima.AdEvent.Type.COMPANION_AD_LOADING_FAILED,
			function(){
			});

	adsManager.addEventListener(
			google.ima.AdEvent.Type.COMPANION_REQUIRED_ERROR,
			function(){
			});

	adsManager.addEventListener(
			google.ima.AdEvent.Type.INVALID_ARGUMENTS,
			function(){
			});

	/*
	 * Funzione invocata quando un annuncio (e viene invocata per ogni annuncio nonLineare, cioè una volta per ogni VAST Response)
	 * ha iniziato ad essere riprodotto per la prima volta (precedentemente viene evocata AdLoaded)
	 */
	adsManager.addEventListener (
			google.ima.AdEvent.Type.STARTED,
			function(adEvent){

				// Disabilito i controls nell'iframe dell'annuncio 
				//Se lo faccio disabilito anche il non-linearClickThrough
				$("iframe").css("pointer-events", "none");

				//Ho letto una nuova VAST Response
				numeroVASTResponsesLette++; 

				/*Parte per l'ad nonLinear*/

				var ad = adEvent.getAd();
				ads[adIndex] = ad;
				//Creo un nuovo div per mostrare l'annuncio nonLineare appena letto
				var divNonLinear = document.createElement('div');
				divNonLinear.setAttribute("id", 'companion-ad' + adIndex);
				divNonLinear.setAttribute("class", 'companionsClass' );
				document.getElementById("adDivsContainer").appendChild(divNonLinear);

				var urlNonLinear= ad.getMediaUrl();

				var urlTypeNonLinear = urlNonLinear.substr(urlNonLinear.lastIndexOf('.') + 1);

				modificaInnerHTMLDivAnnuncio(divNonLinear,  urlTypeNonLinear, urlNonLinear, ad.getWidth(), ad.getHeight(), adIndex, ad.getMinSuggestedDuration()*1000, ad.getAdPodInfo().getTimeOffset());



				/*
				 * Sposto gli annunci non lineari a seconda della VAST Response con la quale sono stati invisti
				 * 
				 * PURTROPPO NON SI PUO' fare con VMAP NE VAST perché non è prevista la posizione tra le specifiche dei nonLineari
				 */

				//A seconda della VAST Response assegno delle azioni diverse

				//La posizine che gli annunci lineari e non lineari devono assumere è legata all'array
				//position
				//alert(ad.getAdId());
				var itemPosizioneDaAssumereNonLineareECompanion = positions[ad.getAdId()];
				//alert(itemPosizioneDaAssumereNonLineareECompanion);
				var coordinateNonLineare=itemPosizioneDaAssumereNonLineareECompanion["posizioneNonLineare"];
				//alert(coordinateNonLineare + " coordinateNonLineare");
				posizionaAnnuncioAPartireDaPosInAltoASx(divNonLinear, ad.getVastMediaWidth(), ad.getVastMediaHeight(),coordinateNonLineare["positionX"], coordinateNonLineare["positionY"] , 0);
				/*
					switch (indiceVMAPTimeOffset){
					case 0:{
						posizionaAnnuncioAPartireDaPosInAltoASx(divNonLinear, ad.getVastMediaWidth(), ad.getVastMediaHeight(),640-ad.getVastMediaWidth(), 0 , 0);
						break;
					}
					case 1: {
						posizionaAnnuncioAPartireDaPosInAltoASx(divNonLinear, ad.getVastMediaWidth(), ad.getVastMediaHeight(), 0, 360-ad.getVastMediaHeight()-40, 0);
						break;
					}
					//Aggiungere nuovi "case" per altre VAST Response
					default: break;
					}
				 */



				adIndex++;




				/*Poichè IMA riesce a leggere solo i companions delle VAST Responses successiva alla prima 
				 *dando l'errore a!= undefined di IMA che manda la funzione in CRASH devo controllare che 
				 *mi trovo nella prima VAST Response, prima di effettuare una request per i companionAds
				 */
				if(numeroVASTResponsesLette<1){ 
					var selectionCriteria = new google.ima.CompanionAdSelectionSettings();
					selectionCriteria.resourceType = google.ima.CompanionAdSelectionSettings.ResourceType.STATIC;
					selectionCriteria.creativeType = google.ima.CompanionAdSelectionSettings.CreativeType.ALL;
					/*IGNORO LA SIZE NEL PRENDERE GLI ANNUNCI COMPANION: IL VALORE 320X180 DI ad.getCompanionAds
					 * verrà ignorato saranno presi tutti i companions di ogni size				 * 
					 */
					selectionCriteria.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;
					var companionAdsToAdd = ad.getCompanionAds(320, 180, selectionCriteria);
					// Prendo tutti i companions, di ogni size (dove size è intesa come i valori inseriti negli attributi width ed height nel tag <companion> e non quelle effettive del contenuto multimediale), grazie alla selectionCriteria.SizeCriteria.IGNORE


					//Aggiungo anche gli annunci companion nell'array
					var indexIiziaAdAggiungereAd = adIndex;
					for (var x=0; x<companionAdsToAdd.length; x++){
						ads[indexIiziaAdAggiungereAd]=companionAdsToAdd[x];
						indexIiziaAdAggiungereAd++;
					}



					/*
					 * Variabile che mi scorre tutti gli annunci companion che sto analizzando nella corrente VAST Responses;
					 * si ricordi che IMA è in grado di leggere annunci companion solo per la prima VAST Response che analizza
					 * 
					 */

					var companionAdsIndex=0;

					//Recupero dall'item di position correntemente analizzato l'array contenente la posizione
					//dei companion
					var arrayPosizioniDeiCompanion=itemPosizioneDaAssumereNonLineareECompanion["arrayDellePosizioniDeiCompanion"];
					//alert(arrayPosizioniDeiCompanion + " arrayPosizioniDeiCompanion");

					//Creo nuovi div per mostrare gli annunci companion appena letti
					for (var q=adIndex; q<ads.length;q++){

						var companionAd = ads[q];
						var divCompanion = document.createElement('div');
						divCompanion.setAttribute("id", 'companion-ad' + adIndex);
						divCompanion.setAttribute("class", 'companionsClass' );
						document.getElementById("adDivsContainer").appendChild(divCompanion);

						// Prendo l' HTML content dal companion ad.
						var content = companionAd.getContent();
						// Inserisco l'HTML content nel divCompanion che deve mostrare l'annuncio companion, tuttavia
						//per avere una migliore customizzazione (ad esempio per poter riconoscere quando un companion
						//di tipo "video" è terminato è possibile inserire l'evento iframe.onended, evento che IMA SDK non
						//non prevede per gli annunci companion) cancellero l'HTML scaricato da IMA SDK in automatico
						// (ossia companionAd.getContent()) e lo sostituirò con uno customizzato che mostri lo stesso
						//annuncio companion

						divCompanion.innerHTML = content;



						//Modifico ogni annuncio creandone un div a parte


						var url= divCompanion.firstChild.firstChild.src;

						if(url==null){
							//Nel caso in cui il companion ad è un immagine il modo corretto di prendere l'url è questo
							url= divCompanion.firstChild.firstChild.firstChild.src;
						}


						var urlType = url.substr(url.lastIndexOf('.') + 1);

						/*
						 * Modifico l'HTML del div appena creato aggiungendo le informazioni appena create
						 */
						modificaInnerHTMLDivAnnuncio(divCompanion,  urlType, url, companionAd.getWidth(), companionAd.getHeight(), q, ad.getMinSuggestedDuration()*1000, ad.getAdPodInfo().getTimeOffset());

						var iesimaPosizioneCompanion= arrayPosizioniDeiCompanion[companionAdsIndex++];
						posizionaAnnuncioAPartireDaPosInAltoASx(divCompanion,companionAd.getWidth(), companionAd.getHeight(), iesimaPosizioneCompanion["positionX"], iesimaPosizioneCompanion["positionY"], adIndex);

					}
				}

				//Se sto gia in modalità fullscreen prima che l'annuncio sia iniziato devo ridimensionare la size degli annunci
				if(fullScreenBoolean){

					/*Poichè IMA riesce a leggere solo i companions delle VAST Responses successiva alla prima 
					 *nel caso io abbia letto la prima VAST Response allora riposiziono e ridimensiono tutti gli annunci mostrati 
					 *(che sono il nonLinear, e 0 o più companions)
					 *Se invece sto in una delle successive VAST Responses devo riposizionare e ridimensionare solo l'ultimo, 
					 *in quanto gli altri sono gia stati riposizionati e ridimensionati quando sono entrato in modalità fullscreen
					 *precedentemente
					 */
					if(numeroVASTResponsesLette<1){
						var k;
						for (k=0; k<ads.length; k++){

							resizeAndRepositionAds("toFullscreen", k, 640, 360, 	window.screen.width, window.screen.height);

						}
					}else {
						resizeAndRepositionAds("toFullscreen", ads.length-1, 640, 360, 	window.screen.width, window.screen.height);
					}
				}

				// Disabilito i controls nell'iframe degli annunci
				//Se lo faccio disabilito anche il non-linearClickThrough


				$("iframe").css("pointer-events", "none");


			});


	//Funzione che uso per togliere da mezzo l'HTML creato automaticamente da IMA e sostituirlo con uno mio 
	//customizzato in modo da poter aggiungere eventi come la fine di un annuncio a seconda del tipo di file 
	//dell'annuncio
	//Se minSuggestedDuration!=null allora l'annuncio è un nonLineare, altrimenti è un companion
	function modificaInnerHTMLDivAnnuncio(div , urlType, url, width, height, q, minSuggestedDuration, timeOffset){
		//////alertannunciVMAPOffset[numeroVASTResponsesLette] + " starting time ");
		$(div).data("urlType", urlType);
		//Aggiungo i formati più comuni per le immagini
		switch (urlType){
		case "jpg": 
		case "png":
		case "gif":
		case "bmp":{


			var imageelement = document.createElement("img");
			imageelement.width=width;
			imageelement.height=height;

			imageelement.setAttribute("src", url);
			imageelement.setAttribute("id", "imageAd " + q);

			div.innerHTML= "";
			div.appendChild(imageelement);
			//Da che secondo deve essere mostrato nel video player

			var  millisecondStartShowing =  timeOffset * 1000;


			//Scelgo per l'annuncio companion la durata di 10 seoondi, posso farlo durare una quantità a scelta, anche ad esempio nonLinearAd.getMinSuggestedDuration per farlo durare lo stesso periodo dell'annuncio nonLineare
			var durata;
			if(minSuggestedDuration!=null){
				durata = minSuggestedDuration;

			}	else {
				durata = STANDARD_MILLISECONDS_TIMEOUT;
			}
			//Fino a che secondo
			var millisecondEndShowing = millisecondStartShowing + durata;


			if(	$(div).data("describer")==null){
				aggiungiAAdsDescribers(millisecondStartShowing,millisecondEndShowing, durata, div, imageelement,  urlType);
			}


			break;

		}


		case "mp3": 
		case "wav": 
		case "ogg": {
			var audioelement = document.createElement("audio");
			audioelement.width=width;
			audioelement.height=height;

			audioelement.setAttribute("autoplay", true);
			var sourceMP3 = document.createElement("source"); 
			sourceMP3.type = "audio/mpeg";
			sourceMP3.src = url;
			audioelement.appendChild(sourceMP3);
			div.innerHTML= "";
			div.appendChild(audioelement);

			var firstInvokeOfOnPlay=true;
			$(div).css('display', 'none');
			audioelement.onplay=function(){
				if(!firstInvokeOfOnPlay)return;
				firstInvokeOfOnPlay=false;
				//Da che secondo deve essere mostrato nel video player
				var millisecondStartShowing = timeOffset * 1000;


				//Durata
				var durata;
				if(minSuggestedDuration!=null){
					durata =minSuggestedDuration;

				}	else {
					durata =audioelement.duration*1000;
				}

				//Fino a che secondo
				var millisecondEndShowing = millisecondStartShowing + durata;

				if(	$(div).data("describer")==null){
					aggiungiAAdsDescribers(millisecondStartShowing,millisecondEndShowing, durata, div, audioelement,  urlType);
				}				
			}


			break;
		}

		case "mp4": {
			var videoelement = document.createElement("video");
			videoelement.width=width;
			videoelement.height=height;
			videoelement.setAttribute("autoplay", true);
			var sourceMP4 = document.createElement("source"); 
			sourceMP4.type = "video/mp4";
			sourceMP4.src = url;
			videoelement.appendChild(sourceMP4);
			div.innerHTML= "";
			div.appendChild(videoelement);


			var firstInvokeOfOnPlay=true;
			$(div).css('display', 'none');
			videoelement.onplay=function(){
				if(!firstInvokeOfOnPlay)return;
				firstInvokeOfOnPlay=false;
				//Da che secondo deve essere mostrato nel video player
				var millisecondStartShowing = timeOffset * 1000;

				var durata;
				if(minSuggestedDuration!=null){
					durata = minSuggestedDuration;

				}	else {
					durata = videoelement.duration*1000;
				}

				var millisecondEndShowing = millisecondStartShowing + durata;

				if(	$(div).data("describer")==null){
					aggiungiAAdsDescribers(millisecondStartShowing,millisecondEndShowing, durata, div, videoelement,  urlType);
				}
			}


			break;
		}

		default: {
			var defaultelement = document.createElement("img");
			defaultelement.width=width;
			defaultelement.height=height;

			defaultelement.setAttribute("src", url);
			if(isCompanion)
				defaultelement.setAttribute("id", "companionDefault" + q);

			div.innerHTML= "";
			div.appendChild(defaultelement);
			//Da che secondo deve essere mostrato nel video player
			var millisecondStartShowing = timeOffset * 1000;



			var durata;
			if(minSuggestedDuration!=null){
				durata = minSuggestedDuration;

			}	else {
				durata = STANDARD_MILLISECONDS_TIMEOUT;
			}

			//Fino a che secondo
			var millisecondEndShowing = millisecondStartShowing + durata;
			if(	$(div).data("describer")==null){
				aggiungiAAdsDescribers(millisecondStartShowing,millisecondEndShowing, durata, div, defaultelement,  urlType);
			}


			break;


		}
		}


	}


	/*
	 * Funzione che aggiunge un describer come data ad ogni annuncio: mi serve per raccogliere tutte le informazioni necessarie 
	 * di ogni annuncio da poter essere usate nell'evento videoContent.ontimeupdate per stabilire quando mostrare ogni annuncio e come
	 * Inoltre inserisco il tutto nell'array dei describer in ordine di starting time crescente per velocizzare le operazioni di
	 * checking nel timeupdate
	 */
	function aggiungiAAdsDescribers(millisecondStartShowing, millisecondEndShowing, durata, divCompanion, firstDivChild, urlType){
		var orderedIndex=0;
		while(orderedIndex<adsDescribers.length && millisecondStartShowing>adsDescribers[orderedIndex].getMillisecondStartShowing()){
			orderedIndex++;
		} 
		var describer = new AdsDescriber(millisecondStartShowing,millisecondEndShowing, durata, divCompanion, firstDivChild, urlType );
		$(divCompanion).data("describer", describer);
		adsDescribers.splice(orderedIndex, 0 , describer);
	}


	//Non funziona perché IMA non sa quando un annuncio nonLineare è terminato, evento che funziona solo con annunci lineari.
	adsManager.addEventListener (
			google.ima.AdEvent.Type.COMPLETE,
			function(){
				$("#adDisplay").css("display", "none");
			});


	adsManager.addEventListener (
			google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
			function(){
				$("#adDisplay").css("display", "none");
			});


	//Evento lanciato al momento nel quale i dati sull'annuncio è caricato: segue l'evento STARTED
	adsManager.addEventListener (
			google.ima.AdEvent.Type.LOADED,
			function(evento){
				divContainer.style= nonLinearStyle;

			});  


	/*Posiziono un annuncio a partire dalla posizione in alto a sx del video player; per non 
	 * andare oltre i limiti del player la desideredX deve essere nell'intervallo[0, 640-width]
	 * e desideredY in [0, 360-height]
	 *  Ovviamente tutto ciò funziona solo con annunci la cui width e height siano inferiori a quelli del
	 *  player
	 */
	function posizionaAnnuncioAPartireDaPosInAltoASx(divContenitoreAnnuncio,width, height, desideredX, desideredY, annID){
		if(desideredX<0 || desideredY<0) return; 
		if (desideredX>640-width){
			console.error("width DELL'annuncio " + annID + " non delle dimensioni giuste");
		} 
		if (desideredY>360-height){
			console.error("height DELL'annuncio " + annID + " non delle dimensioni giuste");
		} 

		/*
		if (desideredX+width<=640){
			divContenitoreAnnuncio.style.left= desideredX + "px";
		} 
		else{
			divContenitoreAnnuncio.style.left= 640-width + "px";
		}
		*/
		
		
		divContenitoreAnnuncio.style.left= desideredX + "px";

		if (desideredY+height<=340){
			divContenitoreAnnuncio.style.top= desideredY + "px";
		} 
		else{
			divContenitoreAnnuncio.style.top= 340-height + "px";
		}

	}

	//Nel seguente try inizialiizzo l'adsManager e faccio partire l'ads Request con tagUrl specificato precedentemente
	//con adsRequest.adTagUrl
	try {

		//Qui si iniziano a computare gli ads, e anche a si inizializza l'ads
		//Manager, facendogli occupare tutto lo schermo. Qui si decide la size
		//dell'ads

		/*
		 * Se sono in fullscreen devo modificare le informazioni base
		 */
		var fullScreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitFullscreenElement;

		if(fullScreenElement){
			var NONLINEAR_FULL_SCREEN_SLOT_WIDTH = NON_LINEAR_SLOT_WIDTH * window.screen.width/640;
			var NONLINEAR_FULL_SCREEN_SLOT_HEIGHT = NON_LINEAR_SLOT_HEIGHT * window.screen.height/360;

			adsManager.init (NONLINEAR_FULL_SCREEN_SLOT_WIDTH, NONLINEAR_FULL_SCREEN_SLOT_HEIGHT, google.ima.ViewMode.NORMAL);


			//Per annunci lineari
			/*
			var LINEAR_FULL_SCREEN_SLOT_WIDTH = LINEAR_SLOT_WIDTH * window.screen.width/640;
			var LINEAR_FULL_SCREEN_SLOT_HEIGHT = LINEAR_SLOT_HEIGHT * window.screen.height/360;

			adsManager.init (LINEAR_FULL_SCREEN_SLOT_WIDTH, LINEAR_FULL_SCREEN_SLOT_HEIGHT, google.ima.ViewMode.NORMAL);
			 */
		}
		else{
			//Per annunci non lineari
			adsManager.init (NON_LINEAR_SLOT_WIDTH, NON_LINEAR_SLOT_HEIGHT, google.ima.ViewMode.NORMAL);

			//Per annunci lineari
			// adsManager.init (LINEAR_SLOT_WIDTH, LINEAR_SLOT_WIDTH, google.ima.ViewMode.NORMAL);
		}


		// Successivamente a questa istruzione verrà effettuata l'adsRequest verso il tagUrl e IMA SDK interprerà
		//le VMAP E VAST RESPONSES
		adsManager.start();




	} catch (adError) {
		// Errore che può essere lanciato se vi è un problema nella VAST response. Usando le API di IMA per la classe
		//adError si otterranno informazioni quali il tipo di errore.
	}
}

function onContentPauseRequested() {
	videoContent.removeEventListener('ended', contentEndedListener);
	videoContent.pause();
}

function onContentResumeRequested() {
	videoContent.addEventListener('ended', contentEndedListener);

	videoContent.play();

}

//Costruttore dei describer degli annunci

function AdsDescriber(millisecondStartShowing,millisecondEndShowing, durata, divCompanion,firstDivChild , urlType ){
	////alertmillisecondStartShowing + " " + adIndex);
	this.millisecondStartShowing=millisecondStartShowing;
	////////alertmillisecondEndShowing/1000 + " millisecondEndShowing");
	this.millisecondEndShowing = millisecondEndShowing;
	this.durata=durata;
	this.divCompanion=divCompanion;
	this.urlType=urlType;
	this.firstDivChild=firstDivChild;


	this.getMillisecondStartShowing = function(){
		return millisecondStartShowing;
	}
	this.getMillisecondEndShowing = function(){
		return millisecondEndShowing;
	}

	this.getDurata= function(){
		return durata;
	}
	this.getDivCompanion = function(){
		return divCompanion;
	}
	this.getUrlType = function(){
		return urlType;
	}

	this.getFirstDivChild = function(){
		return firstDivChild;
	}


}


requestAds();
