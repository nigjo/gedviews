/**
 * Runs a simple Debug Server in a lokal folder.
 * This file can be directly started with Java 11+.
 */
class Server
{
  static final java.util.Map<String, String> types = java.util.Map.of(
      "js", "text/javascript",
      "html", "text/html",
      "ged", "text/x-gedcom",
      "jpg", "image/jpeg",
      "png", "image/png",
      "ico", "image/x-icon"
  );
  
  private static int port = 8080;
  private static String prefix = "/";
  public static void args(String[] a){
    for(int i=0;i<a.length;i++){
      try{
        port = Integer.parseInt(a[i]);
      }catch(NumberFormatException ex){
        prefix = a[i];
        if(prefix.charAt(0)!='/')
          prefix='/'+prefix;
        if(prefix.charAt(prefix.length()-1)!='/')
          prefix+='/';
      }
    }
  }

  public static void main(String[] a) throws java.io.IOException
  {
    args(a);
    java.net.InetSocketAddress host =
        new java.net.InetSocketAddress("localhost", 8080);
    com.sun.net.httpserver.HttpServer server =
        com.sun.net.httpserver.HttpServer.create(host, 0
        );
    server.createContext("/", Server::handleRequest);
    server.start();
    System.out.println("Server is running at http://"
        + host.getHostName() + ":" + host.getPort()+prefix);
  }

  private static void handleRequest(com.sun.net.httpserver.HttpExchange t)
      throws java.io.IOException
  {
    java.net.URI uri = t.getRequestURI();
    if(uri.toString().endsWith("/"))
    {
      uri = uri.resolve("index.html");
    }
    String path=uri.getPath();
    java.io.File local=null;
    if(path.startsWith(prefix)){
      local = new java.io.File("." , path.substring(prefix.length()));
    }
    System.out.print(new java.util.Date().toString());
    System.out.print(" GET " + uri);
    if(local!=null&&local.exists())
    {
      //String response = "This is the response of "+local.getAbsolutePath();
      String filename = local.getName();
      String ext = filename.substring(filename.lastIndexOf('.') + 1);
      if(types.containsKey(ext))
      {
        System.out.print(" " + types.get(ext));
        t.getResponseHeaders()
            .add("Content-Type", types.get(ext));
      }
      System.out.print(" 200 " + local.length());
      t.sendResponseHeaders(200, local.length());
      try( java.io.OutputStream out = t.getResponseBody())
      {
        java.nio.file.Files.copy(local.toPath(), out);
      }
    }
    else
    {
      System.out.print(" 404");
      String response = "File not found " + uri.toString();
      t.sendResponseHeaders(404, response.length());
      try( java.io.OutputStream os = t.getResponseBody())
      {
        os.write(response.getBytes());
      }
    }
    System.out.println();
  }
}
