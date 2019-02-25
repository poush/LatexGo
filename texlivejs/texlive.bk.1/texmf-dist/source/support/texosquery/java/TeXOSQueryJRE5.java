/*
    Copyright (C) 2016 Nicola L.C. Talbot
    www.dickimaw-books.com

    This work may be distributed and/or modified under the
    conditions of the LaTeX Project Public License, either version 1.3
    of this license or (at your option) any later version.
    The latest version of this license is in
    http://www.latex-project.org/lppl.txt
    and version 1.3 or later is part of all distributions of LaTeX
    version 2005/12/01 or later.
*/
package com.dickimawbooks.texosquery;

import java.io.BufferedReader;
import java.util.Locale;
import java.util.Calendar;
import java.text.DecimalFormatSymbols;
import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 * Main class. Supports Java 5 onwards.
 * @author Nicola Talbot
 * @version 1.2
 * @since 1.2
 */
public class TeXOSQueryJRE5 extends TeXOSQuery
{
   public TeXOSQueryJRE5()
   {
      super("texosquery-jre5");
   }

    /**
     * Main method.
     * @param args Command line arguments.
     */
   public static void main(String[] args)
   {
      try
      {
         (new TeXOSQueryJRE5()).processArgs(args);
      }
      catch (IllegalArgumentException e)
      {
         System.err.println(e.getMessage());
         System.exit(1);
      }
   }
}
