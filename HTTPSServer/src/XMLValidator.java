import java.io.IOException;
import java.net.URL;
import java.util.HashMap;

import javax.xml.XMLConstants;

import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;

import org.xml.sax.SAXException;

public class XMLValidator {

	public static String SERVER_PATH = "http://localhost/HTTPSServer";
	public static String XSD_PATH="/PositioningXSD.xsd";
	private static HashMap<String, Boolean> map = new HashMap<String,Boolean>();



	public static boolean validate(String xmlFile) {
		if(map.get(xmlFile)!=null) {
			return map.get(xmlFile); 	
		}
		
		SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
		try {
			Schema schema = schemaFactory.newSchema(new StreamSource(new URL("http://localhost/HTTPSServer" +  XSD_PATH).openStream()));
			
			Validator validator = schema.newValidator();	
			//validator.validate(new StreamSource(new URL("http://localhost/HTTPSServer" + xmlFile).openStream()));
			validator.validate(new StreamSource(new URL("http://localhost/HTTPSServer/Positioning.xml" ).openStream()));

			map.put(xmlFile, true);
			return true;
		} catch (SAXException | IOException e) {
			e.printStackTrace();
			map.put(xmlFile, false);
			return false;
		}
	}
	
	public static void main(String [] args){
		System.out.println(validate("/Positioning.xml") + "risultatoMAIN");
		System.out.println(validate("/positioningXML/Positioning.xml"));
	}
}
