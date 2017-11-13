import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;

import org.xml.sax.SAXException;

/**
 * La classe consiste nel metodo statico validate che prende in input un stringa contenente l'URL del file XML da validare
 * ed un altra contenente l'URL della XSD da usare per validarlo.
Essa ha anche un elenco di stringhe contenente gli URL per alcune XSD presenti nel sistema da poter usare.
 */
public class XMLValidator {

	public static final String POSITIONING_XSD="http://localhost/HTTPSServer/positioningXML/PositioningXSD.xsd";
	public static final String VAST_XML_XSD="http://localhost/HTTPSServer/VastXML/vast3_draft.xsd";
	public static final String VMAP_XML_XSD="http://localhost/HTTPSServer/vmap.xsd";
	
	/*Variabile nella quale vengono registrati i valori dei risultati della validazione di una file tramite xsd
	* (la chiave String = url della XSD + URL del file), e il valore booleano della validazione.
	  Sono sicuro che questa map sia unica perché è static, dunque condivisa tra tutte le eventuali instanze di XMLValidator.
	*/
	private static final HashMap<String, Boolean> map = new HashMap<String,Boolean>();


	/**
	 * Metodo che valida un xml secondo una xsd. Per entrambi gli oggetti ne viene passato il rispetto URL come paramentro formale
	 * Per evitare inutili ripetizioni, solo la prima volta che avviene la validazione di un file XML secondo una data XSD 
	 * viene effettuata la validazione, e ciò avviene in un blocco synchronized per permettere ad un unico thread 
	 * @param xsdDaUsare La xsd da usare per validare il file XML.
	 * @param xmlFile Il file XML da validare.
	 * @return
	 */
	public static boolean validate(String xsdDaUsare, String xmlFile) {
		/* Se il documento è gia stato validato precedentmente, ad esempio tramite filtro di una precedente
		non ha senso validarlo nuovamente. Tutto ciò viene effettuato per velocizzare le operazioni.
		*/
		
		/*Da modificare con gli Interners. Prima cera Synchronized XMLValidator.class ma non va bene perché
		 * cosi blocco anche sinchronizzazioni per coppie di xsdDaUsare + xmlFile differenti tra di loro 
		 * rallentando troppo le operazioni. Effettuerei in generale UNA SOLA validazione alla volta, troppo lento.
		 * Quello che voglio è invece avere un blocco sincronizzato rispetto alla coppia di valori xsdDaUsare + xmlFile
		 * in modo tale che due thread si blocchino a vicenda solo se stanno effettuando ESATTAMENTE lo stesso calcolo.
		 * Si potrebbe usare synchronized (xsdDaUsare  + xmlFile) però questo approccio, come spiegato qui da Bart van Heukelom https://stackoverflow.com/questions/7555826/synchronize-on-value-not-object, non funziona.
		 * Infatti il sincronized, per sua stessa definizione, blocca secondo ISTANZA dell'oggetto, e NON il suo VALORE.
		 * Ricordandoci poi che in Java per le stringhe, a differenza degli altri oggetti nel quale è il programmatore tramite
		 * l'operatore new a definire quando vada creata una nuova instanza, mentre per esse la creazione/spostamento nella garbage
		 * è gestito totalmente dalla JVM, si crea un casino tramendo. A volte, per thread differenti (il filtro che le invoca è unico 
		 * e può essere eseguito in parallelo da più thread per più request parallele) si possono creare nuove stringhe , altre no (i thread condividono la stessa memoria, le stesse variabili di istanza, 
		 * dunque queste stringhe, definite all'interno del metodo, non dovrebbero essere condivise da più thread, però la gestione delle stringhe in Java è del tutto particolare...).	
		 * Dunque a volte potrei bloccare l'esecuzione di operazioni identiche, ALTRE NO. Una soluzione è usare 
		 * https://google.github.io/guava/releases/19.0/api/docs/com/google/common/collect/Interners.html 
		 */
		if(map.get(xsdDaUsare + xmlFile)!=null) {
			return map.get(xsdDaUsare + xmlFile); 	
		}
		
		//Uso l'intern della stringa concatenante la xsdDaUsare e l'XMLFile per sincronizzare.
		String intern= (xsdDaUsare  + xmlFile).intern();
		//Se l'XML file non è stato ancora controllato allora solo il primo thread che tanta di validarlo deve effettuare il controllo, gli altri no.
		synchronized (intern) {
			/*
			 * Altrimenti, se il file non è stato ancora validato tramite la xsd, effettuo la validazione,
			 *  concedendo l'accesso in maniera mutualmente esclusiva ai vari thread che potrebbero generarsi tra le varie Request ricevute.
			 */
			
			/*
			 * Per questioni relative ad interferenze tra thread controllo, tramite double checking nuovamente che il valore non sia stato
			 * nel frattempo aggiunto nella HashMap da un altro thread.
			 */
			if(map.get(xsdDaUsare + xmlFile)!=null) {
				return map.get(xsdDaUsare + xmlFile); 	
			}
			
			//Istruzoni per la validazione
			SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
			try {
				Schema schema = schemaFactory.newSchema(new StreamSource(new URL(xsdDaUsare).openStream()));
				Validator validator = schema.newValidator();	
				URL url = new URL("http://localhost/HTTPSServer" + xmlFile);

				validator.validate(new StreamSource(url.openStream()));

				map.put(xsdDaUsare + xmlFile, true);
				return true;
			} catch (SAXException | IOException e) {
				/*Se la validazione non va a buon fine (sia per problemi relativi ad I/O oppure nel caso che il file
				* non rispetta la XSD viene lanciata un eccezione, nel primo caso della classe IOException, nel secondo
				* della classe SAXException. In tal caso imporrò false come valore risultante della validazione.
				*/
				e.printStackTrace();
				map.put(xsdDaUsare + xmlFile, false);
				return false;
			}
		}
	}
	
	

	

	public static void main(String [] args){
		System.out.println(validate(XMLValidator.POSITIONING_XSD,"/positioningXML/Positioning.xml") + " risultatoMAIN");
		System.out.println(validate(XMLValidator.VAST_XML_XSD,"/VastXML/Ermafrodito.xml") + " risultatoMAIN");
		System.out.println(validate(XMLValidator.VAST_XML_XSD,"/VastXML/FanciullaDiAnzio.xml") + " risultatoMAIN");
		System.out.println(validate(XMLValidator.VMAP_XML_XSD,"/VmapTest.xml") + " risultatoMAIN");
	}
}
