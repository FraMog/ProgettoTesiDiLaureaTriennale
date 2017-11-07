import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet Filter implementation class FilterXMLPositioning
 */
@WebFilter(
		filterName="/FilterXMLValidation",

		dispatcherTypes = {DispatcherType.REQUEST },
		//Per quali pattern effettuare il filtro
		urlPatterns = {
				"/positioningXML/*",
				"/VastXML/*",
				"/VmapTest.xml"
			
		})
/**
 * Classe che intercetta tutte le request per gli elementi contenuti nelle directory /positioningXML /VastXML e il file VmapTest.xml
 * effettuando la validazione di tali documenti usando la classe XMLValidator.
 * @author Francesco
 *
 */
public class FilterXMLValidation implements Filter {
	


	public static int NUMEROREQUEST=0;

	/**
	 * Default constructor. 
	 */
	public FilterXMLValidation() {
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see Filter#destroy()
	 */
	public void destroy() {
		// TODO Auto-generated method stub
	}

	/**
	 * @see Filter#doFilter(ServletRequest, ServletResponse, FilterChain)
	 */
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		
		HttpServletRequest httpReq = (HttpServletRequest) request;
		
		
		/*Per evitare che venga filtrato anche le XSD relative ai vari documenti che si trovano nella stessa directory degli XML ai quali si riferiscono, 
		* aggiungo questo controllo
		*/
		if(httpReq.getRequestURI().endsWith("xsd") || httpReq.getRequestURI().contains(".xsd")){
			return;
		}
		Logger.getLogger("myLogger").info("In FilterXMLValidation l'URL da validare è " + httpReq.getRequestURI());

		/*Se l'user agent è Java vuoi dire che la request non è proveniente da un browser ma dall'applicazione stessa.
		 * Ciò avviene nel metodo XMLValidator.validate, specificatamente nell'istruzione 
		 * 	URL url = new URL("http://localhost/HTTPSServer" + xmlFile);
		 * nella quale viene effettuata una nuova HTTP Request, in questo caso dall'applicazione Java.
		 * In tal caso non va effettuato nuovamente la validazione.
		 */
		if(!httpReq.getHeader("user-agent").startsWith("Java")){
			//Controllo ogni documento XML con la rispettiva XSD.
			boolean isValid=false;
			if(httpReq.getRequestURI().contains("/positioningXML/")){
				isValid = XMLValidator.validate(XMLValidator.POSITIONING_XSD ,httpReq.getRequestURI().replace(httpReq.getContextPath(), ""));			
			}else if(httpReq.getRequestURI().contains("/VastXML/")){
				isValid = XMLValidator.validate(XMLValidator.VAST_XML_XSD ,httpReq.getRequestURI().replace(httpReq.getContextPath(), ""));			
			}else if(httpReq.getRequestURI().contains("/VmapTest.xml")){
				isValid = XMLValidator.validate(XMLValidator.VMAP_XML_XSD ,httpReq.getRequestURI().replace(httpReq.getContextPath(), ""));			
			}
			Logger.getLogger("myLogger").info("isValid= " + isValid);
			//Se la validazione ha come risultato false invio una HTTP Response di Errore.
			if(!isValid){
				((HttpServletResponse) response).sendError(500, "L'XML richiesto non rispetta la XSD");
				return;
			}
		
		}
		chain.doFilter(request, response);
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	public void init(FilterConfig fConfig) throws ServletException {
		// TODO Auto-generated method stub
	}

}
