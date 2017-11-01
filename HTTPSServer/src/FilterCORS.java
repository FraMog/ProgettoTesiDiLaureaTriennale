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
public class FilterCORS implements Filter {

   public static volatile AtomicInteger numeroAccessi=new AtomicInteger(0);
   
   public static final String [] ALLOWED_ORIGINS= {"http://imasdk.googleapis.com" , "https://imasdk.googleapis.com", "https://www.tcp.googlesyndication.com" };
    /**
     * Default constructor. 
     */
    public FilterCORS() {
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
       // Logger.getLogger("MyLogger2").setLevel(Level.OFF);
 //       Logger.getLogger("MyLogger").setLevel(Level.OFF);
		
		
		HttpServletRequest httpReq = (HttpServletRequest) request;
		
		Logger.getLogger("MyLogger").info("In FilterCORS n° request " + numeroAccessi.incrementAndGet() + " Metodo: " + httpReq.getMethod() + " URL: " + httpReq.getRequestURL()); 
	
	        HttpServletResponse httpResp = (HttpServletResponse) response;

	        // No Origin header present means this is not a cross-domain request
	        //(condizione necessaria ma non sufficiente)
	        String origin = httpReq.getHeader("Origin");
	        Logger.getLogger("MyLogger").info("In FilterCORS l'origine è " + origin);
	         if (origin == null) {
	            // Return standard response if OPTIONS request w/o Origin header
	        	 httpResp.setHeader("Access-Control-Allow-Origin", "https://imasdk.googleapis.com, https://www.tcp.googlesyndication.com");
	        	 Logger.getLogger("MyLogger").info("ACCESS TO ALL ");
	        	 if ("OPTIONS".equalsIgnoreCase(httpReq.getMethod())) {
	                httpResp.setHeader("Allow", VALID_METHODS);
	                httpResp.setStatus(200);
	                return;
	            }
	        } else {
	            // This is a cross-domain request, add headers allowing access
	        	
	        	
	        	/*Utile sia nel caso della simple request che della preflight request
	        	The Access-Control-Allow-Origin response header indicates whether the response 
	        	can be shared with resources with the given origin.
	        	*/
	          //  httpResp.setHeader("Access-Control-Allow-Origin", "*");
	        	
	        	
	           for (int i=0; i< ALLOWED_ORIGINS.length; i++)
	        	   if (origin.equals(ALLOWED_ORIGINS[i]))	           
	        		   httpResp.setHeader("Access-Control-Allow-Origin", origin);
	          
	           /*
	           Enumeration <String> headersRequest=  httpReq.getHeaderNames();
	          
	           
	          while(headersRequest.hasMoreElements()){
	        	  String next = headersRequest.nextElement();
	        	 Logger.getLogger("MyLogger2").info("Header " + next + " value " + httpReq.getHeader(next));
	          }
	          */
	           
	  
	            /*Utile solo nel caso della preflight request
	         	The Access-Control-Allow-Methods response header specifies the method or methods allowed 
	         	when accessing the resource in response to a preflight request.
	             
	            httpResp.setHeader("Access-Control-Allow-Methods", VALID_METHODS);
	            
	            
	          

	            String headers = httpReq.getHeader("Access-Control-Request-Headers");
	            if (headers != null)
	                httpResp.setHeader("Access-Control-Allow-Headers", headers);
				*/
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
