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
      "png", "image/png"
  );

  public static void main(String[] a) throws java.io.IOException
  {
    java.net.InetSocketAddress host =
        new java.net.InetSocketAddress("localhost", 8080);
    com.sun.net.httpserver.HttpServer server =
        com.sun.net.httpserver.HttpServer.create(host, 0
        );
    server.createContext("/", Server::handleRequest);
    server.start();
    System.out.println("Server is running at http://"
        + host.getHostName() + ":" + host.getPort());
  }

  private static void handleRequest(com.sun.net.httpserver.HttpExchange t)
      throws java.io.IOException
  {
    java.net.URI uri = t.getRequestURI();
    if(uri.toString().equals("/"))
    {
      uri = uri.resolve("index.html");
    }
    java.io.File local = new java.io.File("." + uri.getPath());
    System.out.print(new java.util.Date().toString());
    System.out.print(" GET " + uri);
    if(local.exists())
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
