import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.*;

/**
 * Servlet Filter implementation class MyFilter
 */
@WebFilter(
		filterName= "/FilterCORS",
		dispatcherTypes = {DispatcherType.REQUEST }
					, 
		//Per quali pattern effettuare il filtro
		urlPatterns = { 
				"/VastXML/*",
				"/positioningXML/*", //Nel caso in cui il client e il server non siano entrambi sullo stesso host si ha una CORS Request anche per ottenere i file della cartella positioning
				"/VmapTest.xml",
				"/VpaidNonLinear.js",
		})

/**
 * Filtro che si attiva ad ogni request per una risorsa indicata in @urlPattern. Nel caso vi sia una CORS request
 * garantisce l'accesso solo alle origin autorizzate.
 * @author Francesco
 *
 */
public class FilterCORS implements Filter {

   //Variabile atomica che tiene conto del numero degli accessi effettuati nel Filtro.
   public static volatile AtomicInteger numeroAccessi=new AtomicInteger(0);
   /*Elenco delle origin che hanno il permesso di accedere alle risorse per le quali questo filtro è attivo
   * di una CORS Request.
   */
   public static final String [] ALLOWED_ORIGINS= {"http://imasdk.googleapis.com" , "https://imasdk.googleapis.com", "https://www.tcp.googlesyndication.com" };
    /**
     * Default constructor. 
     */
    public FilterCORS() {
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
       // Logger.getLogger("MyLogger2").setLevel(Level.OFF);
	   //Logger.getLogger("MyLogger").setLevel(Level.OFF);
		
		
		HttpServletRequest httpReq = (HttpServletRequest) request;
		
		Logger.getLogger("MyLogger").info("In FilterCORS n° request " + numeroAccessi.incrementAndGet() + " Metodo: " + httpReq.getMethod() + " URL: " + httpReq.getRequestURL()); 
	
	        HttpServletResponse httpResp = (HttpServletResponse) response;

	        // No Origin header present means this is not a cross-domain request
	        String origin = httpReq.getHeader("Origin");
	        Logger.getLogger("MyLogger").info("In FilterCORS l'origine è " + origin);
	         if (origin == null) {
	            //Do l'accesso
	        	 httpResp.setHeader("Access-Control-Allow-Origin", "https://imasdk.googleapis.com, https://www.tcp.googlesyndication.com");
	        	 Logger.getLogger("MyLogger").info("ACCESS TO ALL ");
	        	 if ("OPTIONS".equalsIgnoreCase(httpReq.getMethod())) {
	                httpResp.setHeader("Allow", VALID_METHODS);
	                httpResp.setStatus(200);
	                return;
	            }
	        } else {
	            // This is a cross-domain request, add headers allowing access
	        	
	        	
	           for (int i=0; i< ALLOWED_ORIGINS.length; i++)
	        	   if (origin.equals(ALLOWED_ORIGINS[i]))	           
	        		   httpResp.setHeader("Access-Control-Allow-Origin", origin);
	         
	            // Allow caching cross-domain permission
	            httpResp.setHeader("Access-Control-Max-Age", "3600");
	        }
	        // Pass request down the chain, except for OPTIONS
	        if (!"OPTIONS".equalsIgnoreCase(httpReq.getMethod())) {
	        	chain.doFilter(request, response);
	        }
		
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	public void init(FilterConfig fConfig) throws ServletException {
		// TODO Auto-generated method stub
	}

	public static String VALID_METHODS = "DELETE, HEAD, GET, OPTIONS, POST, PUT";
}
