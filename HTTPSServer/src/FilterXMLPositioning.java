

import java.io.IOException;


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
		filterName="/FilterXMLPositioning",

		dispatcherTypes = {DispatcherType.REQUEST },
		//Per quali pattern effettuare il filtro
		urlPatterns = {
				"/Positioning.xml",	
		})
public class FilterXMLPositioning implements Filter {

	public static int NUMEROREQUEST=0;

	/**
	 * Default constructor. 
	 */
	public FilterXMLPositioning() {
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

		System.out.println(NUMEROREQUEST++);

		if(!httpReq.getHeader("user-agent").startsWith("Java")){

			System.out.println(httpReq.getRequestURI().replace(httpReq.getContextPath(), ""));
			boolean isValid= XMLValidator.validate(httpReq.getRequestURI().replace(httpReq.getContextPath(), ""));
			System.out.println(isValid);
			if(!isValid){
				((HttpServletResponse) response).sendError(500, "L'XML richiesto non rispetta la XSD");
				return;
			}
			chain.doFilter(request, response);
		}
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	public void init(FilterConfig fConfig) throws ServletException {
		// TODO Auto-generated method stub
	}

}