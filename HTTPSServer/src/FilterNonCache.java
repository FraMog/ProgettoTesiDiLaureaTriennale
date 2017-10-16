

import java.io.IOException;
import java.sql.Date;
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
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet Filter implementation class FilterNonCache
 */
@WebFilter(
		filterName= "/FilterNonCache",
		dispatcherTypes = {DispatcherType.REQUEST }
		, 
//Per quali pattern effettuare il filtro
		urlPatterns = { 
				"/MyFilter",
				"/VastTest2.xml",
				"/VastTest3.xml",
				"/VmapTest.xml",
				"/CompanionTest.xml",
				"/CompanionTest2.xml",
				"/VPAIDTest.xml",
				"/VpaidCallbackAd.js",
				"/VPAIDTestNonLineare.xml",
				"/VpaidNonLinear.js",
		})

public class FilterNonCache implements Filter {

	 public static volatile AtomicInteger numeroAccessi=new AtomicInteger(0);
	
    /**
     * Default constructor. 
     */
    public FilterNonCache() {
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
		Logger.getLogger("MyLoggerNonCache").info("In FilterNonCache n° request " + numeroAccessi.incrementAndGet() + " Metodo: " + httpReq.getMethod() + " URL: " + httpReq.getRequestURL()); 
		
		HttpServletResponse resp = (HttpServletResponse) response;
        resp.setHeader("Expires", "Tue, 03 Jul 2001 06:00:00 GMT");
        resp.setDateHeader("Last-Modified", new Date(System.currentTimeMillis()).getTime());
        resp.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0");
        resp.setHeader("Pragma", "no-cache");

        chain.doFilter(request, response);
		chain.doFilter(request, response);
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	public void init(FilterConfig fConfig) throws ServletException {
		// TODO Auto-generated method stub
	}

}
