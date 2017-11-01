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
	private static final HashMap<String, Boolean> map = new HashMap<String,Boolean>();


	/**
	 * Metodo che valida un xml secondo una xsd. Per entrambi gli oggetti ne viene passato il rispetto URL come paramentro formale
	 * Per evitare inutili ripetizioni, solo la prima volta che avviene la validazione di un file XML secondo una data XSD 
	 * viene effettuata la validazione, e ciò avviene in un blocco synchronized per permettere ad un unico thread 
	 * @param xsdDaUsare
	 * @param xmlFile
	 * @return
	 */
	public static boolean validate(String xsdDaUsare, String xmlFile) {
		System.out.println(xsdDaUsare);
		System.out.println("ciao");
		if(map.get(xmlFile)!=null) {
			return map.get(xmlFile); 	
		}

		//Se l'XML file non è stato ancora controllato allora solo il primo thread che tanta di validarlo deve effettuare il controllo, gli altri no.
		synchronized (XMLValidator.class) {
			
			
			if(map.get(xmlFile)!=null) {
				return map.get(xmlFile); 	
			}
			
			SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
			try {
				Schema schema = schemaFactory.newSchema(new StreamSource(new URL(xsdDaUsare).openStream()));
				Validator validator = schema.newValidator();	
				URL url = new URL("http://localhost/HTTPSServer" + xmlFile);
				System.out.println("PATH " + url.getPath());
				System.out.println("FILE " + url.getFile());
				System.out.println("QUERY " + url.getQuery());

				validator.validate(new StreamSource(url.openStream()));

				map.put(xmlFile, true);
				return true;
			} catch (SAXException | IOException e) {
				e.printStackTrace();
				map.put(xmlFile, false);
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
