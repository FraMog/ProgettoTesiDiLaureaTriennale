

import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.transform.sax.SAXSource;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;
import java.util.Objects;

public class Testing {
	/*
    public static final String XML_FILE = "Positioning.xml";
    public static final String SCHEMA_FILE = "PositioningXSD.xsd";
	 *
	 */
	


private static boolean validate(String xmlFile, String schemaFile) {
	SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
	try {
		Schema schema = schemaFactory.newSchema(new StreamSource(new URL("http://localhost/HTTPSServer/PositioningXSD.xsd").openStream()));
		
		Validator validator = schema.newValidator();
		
		validator.validate(new StreamSource(new URL("http://localhost/HTTPSServer/Positioning.xml").openStream()));
		return true;
	} catch (SAXException | IOException e) {
		e.printStackTrace();
		return false;
	}
}

}