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

import java.io.*;
import java.util.Locale;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;
import java.util.Vector;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.text.DecimalFormatSymbols;
import java.text.Format;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.text.DateFormatSymbols;
import java.text.NumberFormat;
import java.text.DecimalFormat;
import java.nio.charset.*;

/**
 * Application functions. These methods need to be Java version 1.5
 * compatible. The 1.7 methods need to be in the TeXOSQueryJRE7 class
 * (which provides the main part of texosquery.jar) and the 1.8 methods in 
 * TeXOSQueryJRE8 (which provides the main part of texosquery-jre8.jar).
 *
 * The texosquery-jre5.jar version should not be considered secure
 * and is only provided for antiquated systems.
 * Java 5 and 6 are both deprecated and are now considered security
 * risks.
 *
 * Since this application is designed to be run from TeX, the output
 * needs to be easy to parse using TeX commands. For this reason,
 * most exceptions are caught and an empty string is returned. The
 * TeX code can then check for an empty value to determine failure.
 * There's a debug mode to print error messages to STDERR to
 * investigate the reason for failure.
 * @author Nicola Talbot
 * @version 1.2.1
 * @since 1.0
 */
public class TeXOSQuery implements Serializable
{
   /**
    * Constructor.
    * @param name The application name. 
    */ 
   public TeXOSQuery(String name)
   {
      this.name = name;
   }

   /**
    * Gets the application name. 
    * @return the application name
    * @since 1.2
    */ 
   public String getName()
   {
      return name;
   }

   /**
    * Runs kpsewhich and returns the result. This is for single
    * argument lookups through kpsewhich, such as a file location
    * or variable value.
    * @param arg The argument to pass to kpsewhich
    * @return The result read from the first line of STDIN
    * @since 1.2
    */
   protected String kpsewhich(String arg)
      throws IOException,InterruptedException
   {
      // Create and start the process.
      Process process = 
        new ProcessBuilder("kpsewhich", arg).start();

      int exitCode = process.waitFor();

      String line = null;

      if (exitCode == 0)
      {
         // kpsewhich completed with exit code 0.
         // Read STDIN to find the result.
                
         InputStream stream = process.getInputStream();
                    
         if (stream == null)
         {
            throw new IOException(String.format(
             "Unable to open input stream from process: kpsewhich '%s'",
             arg));
         }

         BufferedReader reader = null;

         try
         {
            reader = new BufferedReader(new InputStreamReader(stream));

            // only read a single line, nothing further is required
            // for a variable or file location query.
            line = reader.readLine();
         }
         finally
         {
            if (reader != null)
            {
               reader.close();
            }
         }
      }
      else
      {
         // kpsewhich failed.

         throw new IOException(String.format(
           "\"kpsewhich '%s'\" failed with exit code: %d", arg, exitCode));
      }

      return line;
   }

    /**
     * Print message if in debug mode. Message is printed to STDERR
     * if the debug level is greater than or equal to the given level.
     * Debugging messages are all written to STDERR rather than
     * STDOUT so they show up in the transcript rather than being
     * captured by the shell escape.
     * @param message Debugging message.
     * @param level Debugging level.
     * @since 1.2
     */
   public void debug(String message, int level)
   {
      if (debugLevel >= level)
      {
         System.err.println(String.format("%s: %s", name, message));
      }
   }

    /**
     * Print message if in debug mode. Message is printed to STDERR
     * if the debug level is 1 or more.
     * @param message Debugging message.
     * @since 1.2
     */
   public void debug(String message)
   {
      debug(message, DEBUG_ERROR_LEVEL);
   }
    
    /**
     * Message if in debug mode. This is for information rather than
     * errors. The message is printed to STDERR if the debug level
     * is 3 or more.
     * @param message Debugging message.
     * @since 1.2
     */
   public void info(String message)
   {
      debug(message, DEBUG_INFO_LEVEL);
   }
    
    /**
     * Print message and exception if in debug mode. Message is printed to
     * STDERR if the debug level is greater than or equal to the given level.
     * The exception may be null. If not null, the exception message
     * is printed.
     * @param message Debugging message.
     * @param excpt Exception.
     * @param msgLevel Debugging level for message.
     * @param traceLevel Debugging level for stack trace.
     * @since 1.2
     */
   public void debug(String message, Throwable excpt, int msgLevel,
      int traceLevel)
   {
      debug(message, msgLevel);

      if (excpt != null)
      {
         debug(excpt.getMessage(), msgLevel);

         if (debugLevel >= traceLevel)
         {
            excpt.printStackTrace();
         }
      }
   }

    /**
     * Print message and exception if in debug mode. The message
     * level is 1 and the trace level is 2.
     * @param message Debugging message.
     * @param excpt Exception.
     * @since 1.2
     */
   public void debug(String message, Throwable excpt)
   {
      debug(message, excpt, DEBUG_ERROR_LEVEL, DEBUG_STACK_TRACE_LEVEL);
   }

    /**
     * Checks if file is in or below the given directory. This might
     * be easier with java.nio.file.Path etc but that requires Java
     * 1.7, so use the old-fashioned method.
     * @param file The file being checked
     * @param dir The directory being searched
     * @return true if found
     * @since 1.2
     */
   protected boolean isFileInTree(File file, File dir)
    throws IOException
   {
      if (file == null || dir == null) return false;

      file = file.getCanonicalFile();
      dir = dir.getCanonicalFile();

      File parent = file.getParentFile();

      while (parent != null)
      {
         if (parent.equals(dir))
         {
            return true;
         }

         parent = parent.getParentFile();
      }

      return false;
   }

   /**
    * Determine if the given file is hidden.
    * Java's File.isHidden() method seems to consider "." and ".."
    * as hidden directories, so this method converts the file to a
    * canonical path before testing.
    * @param file The file to check
    * @return True if the file is considered hidden. 
     * @since 1.2
    */ 
   public boolean isHidden(File file)
   {
      try
      {
         return file.getCanonicalFile().isHidden();
      }
      catch (IOException e)
      {
         // file can't be converted to a canonical path, so
         // consider it hidden

         debug(String.format(
           "Unable to convert file to a canonical path: ", 
           file.toString()), e);
      }

      return true;
   }

    /**
     * Fallback for openin_any if not found.
     * @since 1.2.2
     */
   public char openinFallbackValue()
   {
      return OPENIN_A;
   }

    /**
     * Queries if the given file may be read according to
     * openin_any. Since the user may not require any of the file
     * access functions, the openin variable is only set the first
     * time this method is used to reduce unnecessary overhead.
     * kpsewhich is used to lookup the value of openin_any, which
     * may have one of the following values: a (any), r (restricted,
     * no hidden files) or p (paranoid, as restricted and no parent
     * directories and no absolute paths except under $TEXMFOUTPUT).
     * Apparently with MikTeX, this variable isn't available, so we
     * need a fallback for that case.
     * @param file The file to be checked
     * @return true if read-access allowed
     * @since 1.2
     */
   public boolean isReadPermitted(File file)
   {
      // if file doesn't exist, it can't be read
      if (file == null || !file.exists())
      {
         return false;
      }

      try
      {
         if (openin == OPENIN_UNSET)
         {
            //First time this method has been called. Use kpsewhich
            //to determine the value.

            try
            {
               String result = kpsewhich("-var-value=openin_any");

               if ("a".equals(result))
               {
                  openin=OPENIN_A;
               }
               else if ("r".equals(result))
               {
                  openin=OPENIN_R;
               }
               else if ("p".equals(result))
               {
                  openin=OPENIN_P;
               }
               else
               {
                  // openin_any variable hasn't been set, use the
                  // fallback value.
                  openin = openinFallbackValue();
                  debug(String.format(
                     "Invalid openin_any value: %s%nUsing fallback value: %s",
                     result, openin));
               }
            }
            catch (Exception e)
            {
               // kpsewhich failed, assume paranoid
               debug("Can't determine openin value, assuming 'p'", e);
               openin = OPENIN_P;
            }

            // Now find TEXMFOUTPUT if set (only need this with the
            // paranoid setting)

            if (openin == OPENIN_P)
            {
               String path = null;

               try
               {
                  path = System.getenv("TEXMFOUTPUT");
               }
               catch (SecurityException e)
               {
                  debug("Can't query TEXMFOUTPUT", e);
               }

               if (path != null && !"".equals(path))
               {
                  texmfoutput = new File(fromTeXPath(path));

                  if (!texmfoutput.exists())
                  {
                     debug(String.format(
                           "TEXMFOUTPUT doesn't exist, ignoring: %s",
                           texmfoutput.toString()));
                     texmfoutput = null;
                  }
                  else if (!texmfoutput.isDirectory())
                  {
                     debug(String.format(
                           "TEXMFOUTPUT isn't a directory, ignoring: %s",
                           texmfoutput.toString()));
                     texmfoutput = null;
                  }
                  else if (!texmfoutput.canRead())
                  {
                     debug(String.format(
                           "TEXMFOUTPUT doesn't have read permission, ignoring: %s",
                           texmfoutput.toString()));
                     texmfoutput = null;
                  }
               }
            }
         }

         // Now check if the given file can be read according to the
         // openin setting.

         switch (openin)
         {
            case OPENIN_A: 
              // any file can be read as long as the OS allows it
               return file.canRead(); 
            case OPENIN_P:
              // paranoid check

              if (isFileInTree(file, texmfoutput))
              {
                 // file under TEXMFOUTPUT, so it's okay as long
                 // as it has read permission
                 return file.canRead();
              }

              // does the file have an absolute path?

              if (file.isAbsolute())
              {
                 debug(String.format(
                   "Read access forbidden by openin_any=%c (has absolute path outside TEXMFOUTPUT): %s",
                   openin, file));
                 return false;
              }

              // is the file outside the cwd?
              File cwd = new File(getSystemProperty("user.dir", "."));

              if (file.getParentFile() != null && !isFileInTree(file, cwd))
              {
                 debug(String.format(
                   "Read access forbidden by openin_any=%c (outside cwd path): %s",
                   openin, file));
                 return false;
              }

            // no break, fall through to restricted check
            case OPENIN_R:

              if (isHidden(file))
              {
                 // hidden file so not permitted
                 debug(String.format(
                   "Read access forbidden by openin_any=%c (hidden file): %s",
                   openin, file));
                 return false;
              }

            break;
            default:
              // this shouldn't happen, but just in case...
              debug(String.format("Invalid openin value: %d", openin));
              // don't allow, something's gone badly wrong
              return false;
         }

         // return read access
         return file.canRead();
      }
      catch (Exception e)
      {
         // Catch all exceptions
         debug(String.format("Read permission check failed: %s", file), e);

         // Can't permit read if something's gone wrong here.
         return false;
      }
   }

    /**
     * Gets the given system property or the default value.
     * Returns the default value if the property isn't set or can't be accessed.
     * @param propName The property name
     * @param defValue The default value
     * @return The property value or the default if unavailable
     * @since 1.2
     */
   public String getSystemProperty(String propName, String defValue)
   {
      try
      {
         return System.getProperty(propName, defValue);
      }
      catch (SecurityException e)
      {
         // The security manager doesn't permit access to this property.

         debug(String.format("Unable to access property: %s", propName), e);
         return defValue;
      }
   }

    /**
     * Escapes potentially problematic characters from a string that will be
     * expanded when input by TeX's shell escape.
     * 
     * Some of the methods in this class return TeX code. Those
     * returned values shouldn't be escaped as it would interfere
     * with the code, so just use this method on information
     * directly obtained from Java. This will typically be either
     * file names (in which case the characters within the string
     * must all be "letter" or "other") or regular text for use in
     * the document (such as dates or times, in which case the
     * characters may be active to allow them to be correctly
     * typeset, such as UTF-8 characters with inputenc.sty).
     *
     * The date-time and numeric patterns (such as "YYYY-MM-DD"
     * or "#,##0.0") are dealt with elsewhere as they need different treatment.
     *
     * \\TeXOSQuery locally defines commands for characters
     * used in file names (catcode 12). These are all in the form
     * \\fxxx (such as \\fhsh for a literal hash). Since the
     * texosquery.tex code is designed to be generic we can't assume
     * the eTeX \\detokenize primitive is available. This does,
     * however, assume that the document author hasn't changed the
     * category codes of the ASCII alphanumerics, but that ought to
     * be a safe assumption.
     *
     * We also have commands for characters intended for use in document
     * text, which shouldn't be interpreted literally. These are all
     * in the form \\txxx (such as \\thsh which should expand to
     * \#).
     *
     * The regular space \\tspc guards against a space occurring after
     * a character that needs to be converted to a control sequence.
     * (For example "# 1" becomes "\\thsh \\tspc 1")
     * There's also a literal space \\fspc to guard against spaces
     * in file names.
     *
     * This should take care of any insane file-naming schemes, such
     * as <tt>bad~file name#1.tex</tt>, <tt>stupid {file} name.tex</tt>,
     * <tt style="white-space: pre;">spaced    out  file #2.tex</tt>,
     * <tt>file's stupid name.tex</tt>.
     *
     * To help protect against input encoding problems, non-ASCII
     * characters are wrapped in \\twrp (regular text) or \\fwrp
     * (file names). \\TeXOSQuery locally redefines these to
     * \\texosquerynonasciiwrap and \\texosquerynonasciidetokwrap 
     * which may be used to provide some protection or conversion from one
     * encoding to another, if required.
     * 
     * For example, the language "fran&#231;ais" would be returned as
     * "fran\\twrp{&#231;}ais", which can be typeset directly with
     * XeTeX or LuaTeX or through active characters with
     * inputenc.sty, but the directory called <tt>Fran&#231;cois</tt> would be
     * returned as <tt>Fran\\fwrp{&#231;}cois</tt>, which will try to
     * detokenize the &#231; character.
     *
     * @param string Input string.
     * @param isRegularText true if the string represents text (for example, 
     * month names), set to false if string is something literal,
     * such as a file name.
     * @return The processed string
     * @since 1.2
     */
   public String escapeSpChars(String string, boolean isRegularText)
   {
      if (compatible < 2)
      {
         return escapeHash(string);
      }

      StringBuilder builder = new StringBuilder();

      // This iterates over Unicode characters so we can't use a simple
      // i++ increment. The offset is obtained from Character.charCount
      for (int i = 0, n = string.length(); i < n; )
      {
         int codepoint = string.codePointAt(i);
         i += Character.charCount(codepoint);

         builder.append(escapeSpChars(codepoint, isRegularText));
      }

      return builder.toString();
   }

    /**
     * Escapes file name. This should already have had the directory
     * divider changed to a forward slash where necessary.
     * @param filename Input string.
     * @return String with characters escaped.
     * @since 1.2
     */
   public String escapeFileName(String filename)
   {
      return escapeSpChars(filename, false);
   }

    /**
     * Escapes regular text.
     * @param string Input string.
     * @return String with characters escaped.
     * @since 1.2
     */
   public String escapeText(String string)
   {
      return escapeSpChars(string, true);
   }

    /**
     * Escapes regular text.
     * @param codepoint Input Unicode character.
     * @return String with characters escaped.
     * @since 1.2
     */
   public String escapeText(int codepoint)
   {
      return escapeSpChars(codepoint, true);
   }

    /**
     * Escapes the given Unicode character.
     * All ASCII punctuation characters have a literal and textual
     * command to represent them in file names and document text,
     * respectively. The literal (file name) commands are prefixed
     * with "f" and the textual commands are prefixed with "t".
     * None of the control codes should appear in any of the
     * results, but they are checked for completeness.
     * @param codePoint Input code point.
     * @param isRegularText true if the character is in a string representing
     * text, set to false if string is a file name etc
     * @return String with character escaped.
     * @since 1.2
     */
   public String escapeSpChars(int codepoint, boolean isRegularText)
   {
      return escapeSpChars(codepoint, isRegularText ? "t" : "f");
   }

    /**
     * Escapes the given Unicode character.
     * As above but with the prefix supplied.
     * @param codePoint Input code point.
     * @param prefix The control sequence name prefix.
     * @return String with character escaped.
     * @since 1.2
     */
   public String escapeSpChars(int codepoint, String prefix)
   {
      switch (codepoint)
      {
         case '!': return String.format("\\%sexc ", prefix);
         case '"': return String.format("\\%sdqt ", prefix);
         case '#': return String.format("\\%shsh ", prefix);
         case '$': return String.format("\\%sdol ", prefix);
         case '%': return String.format("\\%spct ", prefix);
         case '&': return String.format("\\%samp ", prefix);
         case '\'': return String.format("\\%sapo ", prefix);
         case '(': return String.format("\\%sopb ", prefix);
         case ')': return String.format("\\%sclb ", prefix);
         case '*': return String.format("\\%sast ", prefix);
         case '+': return String.format("\\%spls ", prefix);
         case ',': return String.format("\\%scom ", prefix);
         case '-': return String.format("\\%shyn ", prefix);
         case '.': return String.format("\\%sdot ", prefix);
         case '/': return String.format("\\%sslh ", prefix);
         case ':': return String.format("\\%scln ", prefix);
         case ';': return String.format("\\%sscl ", prefix);
         case '<': return String.format("\\%sles ", prefix);
         case '=': return String.format("\\%seql ", prefix);
         case '>': return String.format("\\%sgre ", prefix);
         case '?': return String.format("\\%sque ", prefix);
         case '@': return String.format("\\%satc ", prefix);
         case '[': return String.format("\\%sosb ", prefix);
         case '\\': return String.format("\\%sbks ", prefix);
         case ']': return String.format("\\%scsb ", prefix);
         case '^': return String.format("\\%scir ", prefix);
         case '_': return String.format("\\%susc ", prefix);
         case '`': return String.format("\\%sgrv ", prefix);
         case '{': return String.format("\\%slbr ", prefix);
         case '}': return String.format("\\%srbr ", prefix);
         case '~': return String.format("\\%stld ", prefix);
         case ' ': return String.format("\\%sspc ", prefix);
         // These next few cases shouldn't occur, but
         // check for them anyway.
         case 0x007F: return ""; // delete control
         case 0x0009: return "^^I";// tab
         case 0x000A: // lf (fall through to cr)
         case 0x000C: // ff
         case 0x000D: return " "; // cr
         default:

           if (codepoint < 32)
           {
              return ""; // strip control characters
           }
           else if (codepoint >= 32 && codepoint <= 126)
           {
              // ASCII letters and digits (all ASCII punctuation
              // dealt with above).
              return String.format("%c", codepoint);
           }
           else
           {
              // Outside Basic Latin set.
              return String.format("\\%swrp{%c}", prefix, codepoint);
           }
      }
   }

    /**
     * Escapes any hashes in input string.
     * Now only used if compatibility level is less than 2 (pre
     * texosquery version 1.2).
     * @param string Input string.
     * @return String with hash escaped.
     */
   public static String escapeHash(String string)
   {
      return string.replaceAll("#", "\\\\#");
   }

    /**
     * Escapes hash from input character.
     * No longer required.
     * @param c Input character.
     * @return String with hash escaped.
     */
   public static String escapeHash(char c)
   {
      return String.format("%s", c == '#' ? "\\#" : c);
   }

    /**
     * Gets the OS name. As far as I can tell, the "os.name"
     * property should return a string that just contains Basic
     * Latin upper or lower case letters, so we don't need to worry
     * about special characters.
     * @return The OS name as string.
     */
   public String getOSname()
   {
      return getSystemProperty("os.name", "");
   }

    /**
     * Gets the OS architecture. As with the OS name, this shouldn't
     * contain any special characters.
     * @return The OS architecture as string.
     */
   public String getOSarch()
   {
      return getSystemProperty("os.arch", "");
   }

    /**
     * Gets the OS version. This may contain an underscore, so treat
     * it like a file name.
     * @return The OS version as string.
     */
   public String getOSversion()
   {
      return escapeFileName(getSystemProperty("os.version", ""));
   }

    /**
     * Converts the filename string to TeX path. Since this is designed to work
     * within TeX, backslashes in paths need to be replaced with forward
     * slashes.
     * @param filename The filename string.
     * @return TeX path.
     */
   public String toTeXPath(String filename)
   {
      if (filename == null)
      {
         // This shouldn't happen, but just in case...
         try
         {
            // throw so we can get a stack trace for debugging
            throw new NullPointerException();
         }
         catch (NullPointerException e)
         {
            debug("null file name", e);
         }

         return "";
      }

      // If the OS uses backslash as the directory divider,
      // convert all backslashes to forward slashes. The Java regex
      // means that we need four backslashes to represent a single literal
      // backslash.

      if (File.separatorChar == BACKSLASH)
      {
         filename = filename.replaceAll("\\\\", "/");
      }

      // Does a prefix need stripping?

      if (stripFilePrefix != null && filename.startsWith(stripFilePrefix))
      {
         filename = filename.substring(stripFilePrefix.length());
      }
      else if (pathRegExp != null && pathReplacement != null)
      {
         filename = filename.replaceFirst(pathRegExp, pathReplacement);
      }

      return escapeFileName(filename);
   }

    /**
     * Converts the TeX path to the OS representation.
     * The file name will typically be passed as a parameter through
     * \\TeXOSQuery so it will have forward slashes as the directory
     * divider regardless of the OS (as per \\input and
     * \\includegraphics). This method converts the TeX file name
     * into one that's valid for the OS.
     * @param filename The filename string.
     * @return The OS representation.
     */
   public String fromTeXPath(String filename)
   {
      if (filename == null)
      {
         // This shouldn't happen, but just in case...
         try
         {
            throw new NullPointerException();
         }
         catch (NullPointerException e)
         {
            debug("null file name", e);
         }

         return "";
      }

      if (compatible < 2)
      {
         if (File.separatorChar == BACKSLASH)
         {
            return filename.replaceAll("/", "\\\\");
         }

         return filename;
      }

      // The file name may contain awkward characters. For example,
      // the user may have a file called imagefile#1.png and
      // they're trying to do, say,
      // \TeXOSQuery{\result}{-p imagefile#1.png}
      // If the shell escape is using bash, the hash will be
      // interpreted as a comment character, so the argument
      // received by texosquery will actually be "imagefile"
      // since the "#1.png" part will be interpreted as a comment.

      // The user can protect the # from the shell using
      // \TeXOSQuery{\result}{-p imagefile\string\#1.png}
      // which bash will pass as 'imagefile#1.png', but
      // perhaps another type of shell might pass it literally
      // as 'imagefile\#1.png', so the following allows for
      // that by simply stripping all backslashes from the file name.
      // (The file name is always supplied with forward slashes as
      // the directory divider regardless of the operating system.)
      // We can substitute the divider at this point as well.
 
      StringBuilder builder = new StringBuilder();

      for (int i = 0, n = filename.length(), offset=1; i < n; i+=offset)
      {
         int codepoint = filename.codePointAt(i);
         offset = Character.charCount(codepoint);

         int nextIndex = i+offset;
         int nextCodePoint = (nextIndex<n ? filename.codePointAt(nextIndex):0);

         if (codepoint == '/')
         {
            builder.appendCodePoint(File.separatorChar);
         }
         if (codepoint == BACKSLASH)
         {
            // Would anyone really want a literal backslash in a
            // file name? Allow a double backslash to represent a
            // literal backslash but only if the OS directory
            // divider isn't a backslash. Otherwise discard
            // this character.

            if (File.separatorChar != BACKSLASH && nextCodePoint == BACKSLASH)
            {
               builder.appendCodePoint(codepoint);
               i = nextIndex;
               offset = Character.charCount(nextCodePoint);
            }
            else if (nextCodePoint == '/')
            {
               // Would anyone want a literal forward slash? Allow a
               // slash to be escaped just in case.
               builder.appendCodePoint('/');
               i = nextIndex;
               offset = Character.charCount(nextCodePoint);
            }
         }
         else
         {
            builder.appendCodePoint(codepoint);
         }
      }

      return builder.toString();
   }

    /**
     * Gets a file representation from a filename string. If the
     * provided file doesn't have a parent and if it's not found in the
     * current directory, kpsewhich will be used to locate it on
     * TeX's path. The provided file name is assumed to have been
     * passed through commands provided by texosquery.tex so the
     * directory dividers should be forward slashes, even if the OS
     * uses backslashes. The returned file may not exist. Any method
     * that uses this method needs to check for existence.
     * @param filename Filename string.
     * @return File representation 
     * @since 1.2
     */
   public File fileFromTeXPath(String filename)
   {
      // Convert from TeX to the OS path representation.
      filename = fromTeXPath(filename);

      File file = new File(filename);

      if (!file.exists() && file.getParent() == null)
      {
         // If the file doesn't exist and it doesn't have a parent
         // directory, use kpsewhich to find it.

         try
         {
            String result = kpsewhich(filename);

            if (result != null && !"".equals(result))
            {
               file = new File(fromTeXPath(result));
            }
         }
         catch (Exception exception)
         {
            // Catch all exceptions
            debug(String.format("kpsewhich couldn't find the file: %s",
                                filename),
                  exception);

            // The File object will be returned even though the file
            // can't be found.
         }
      }

      return file;
   }

    /**
     * Gets the user's home directory.
     * @return The user home as string.
     */
   public String getUserHome()
   {
      File dir = new File(getSystemProperty("user.home", ""));

      if (!isReadPermitted(dir))
      {
         debug("Read access not permitted for the home directory");
         return "";
      }

      // The resulting path needs to be converted to a TeX path.
      return toTeXPath(dir.getAbsolutePath());
   }

    /**
     * Gets the current working directory.
     * @return The current working directory.
     */
   public String getCwd()
   {
      File dir = new File(getSystemProperty("user.dir", "."));

      if (!isReadPermitted(dir))
      {
         // perhaps the current directory is hidden?
         debug("Read access not permitted for the current directory");
         return "";
      }

      // The resulting path needs to be converted to a TeX path.
      return toTeXPath(dir.getAbsolutePath());
   }

    /**
     * Gets the temporary directory.
     * @return Temporary directory.
     */
   public String getTmpDir()
   {
      String filename = getSystemProperty("java.io.tmpdir", "");

      if ("".equals(filename))
      {
         // Not set
         return "";
      }

      File dir = new File(filename);

      if (!isReadPermitted(dir))
      {
         debug(String.format("Read access not permitted for directory: %s", 
           dir));
         return "";
      }

      // The resulting path needs to be converted to a TeX path.
      return toTeXPath(filename);
   }

   /**
    * Gets the week year for the given calendar.
    * Calendar.getWeekYear() was added to Java 7, so this defaults
    * to the year instead. This method needs to be overridden in
    * TeXOSQueryJRE7 and TeXOSQueryJRE8.
    * @return The week year
    * @since 1.2
    */ 
   public int getWeekYear(Calendar cal)
   {
      return cal.get(Calendar.YEAR);
   }

   /**
    * Converts the day of week index returned by
    * Calendar.DAY_OF_WEEK to Monday=1 based indexing.
    * @param index the day of week index obtained from Calendar.DAY_OF_WEEK
    * @return index with Monday=1 as the base
    * @since 1.2
    */ 
   private int getDayOfWeekIndex(int index)
   {
      switch (index)
      {
         case Calendar.MONDAY: return 1;
         case Calendar.TUESDAY: return 2;
         case Calendar.WEDNESDAY: return 3;
         case Calendar.THURSDAY: return 4;
         case Calendar.FRIDAY: return 5;
         case Calendar.SATURDAY: return 6;
         case Calendar.SUNDAY: return 7;
      }

      try
      {
        // this shouldn't happen
        throw new IllegalArgumentException(
          String.format("Invalid day of week index: %d", index));
      }
      catch (Exception e)
      {
         debug(e.getMessage(), e);
      }

      return 0;
   }

   /**
    * Gets all the date-time data for the current date-time. 
    * @return data in format that can be read by \\texosqueryfmtdatetime
    * @since 1.2
    */ 
   public String getDateTimeData()
   {
      Calendar cal = Calendar.getInstance();
      cal.setTimeInMillis(now.getTime());

      int hourH = cal.get(Calendar.HOUR_OF_DAY);

      int hourk = (hourH == 0 ? 24 : hourH);

      int hourK = cal.get(Calendar.HOUR);

      int hourh = (hourK == 0 ? 12 : hourK);

      TimeZone timeZone = cal.getTimeZone();
      boolean isDaylightSaving = timeZone.inDaylightTime(now);

      int timezoneoffset = cal.get(Calendar.ZONE_OFFSET);

      if (isDaylightSaving)
      {
         timezoneoffset += cal.get(Calendar.DST_OFFSET);
      }

      // convert from offset millisec to hours and minutes
      // (ignore left-over seconds and milliseconds)

      int tzm = timezoneoffset/60000;

      int tzh = tzm/60;

      tzm = tzm % 60;

      return String.format(
       "{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{%d}{{%d}{%d}{%s}{%d}}",
       cal.get(Calendar.ERA),
       cal.get(Calendar.YEAR),
       getWeekYear(cal),
       cal.get(Calendar.MONTH)+1,
       cal.get(Calendar.WEEK_OF_YEAR),
       cal.get(Calendar.WEEK_OF_MONTH),
       cal.get(Calendar.DAY_OF_YEAR),
       cal.get(Calendar.DAY_OF_MONTH),
       cal.get(Calendar.DAY_OF_WEEK_IN_MONTH),
       getDayOfWeekIndex(cal.get(Calendar.DAY_OF_WEEK)),// Monday=1, etc
       cal.get(Calendar.AM_PM),
       hourH, hourk, hourK, hourh,
       cal.get(Calendar.MINUTE),
       cal.get(Calendar.SECOND),
       cal.get(Calendar.MILLISECOND),
       tzh, tzm, timeZone.getID(), 
       isDaylightSaving ? 1 : 0);
   }

   /**
    * Get the time zone names for the given locale.
    * The data for each zone is provided in the form
    * {id}{short name}{long name}{short dst name}\marg{long dst name}
    * @param localeTag The locale 
    * @return list of zone information for the locale
    * @since 1.2
    */ 

   public String getTimeZones(String localeTag)
   {
      Locale locale;

      if (localeTag == null || "".equals(localeTag))
      {
         locale = Locale.getDefault();
      }
      else
      {
         locale = getLocale(localeTag);
      }

      StringBuilder builder = new StringBuilder();

      String[] zones = TimeZone.getAvailableIDs();

      for (int i = 0; i < zones.length; i++)
      {
         TimeZone tz = TimeZone.getTimeZone(zones[i]);

         builder.append(String.format("{{%s}{%s}{%s}{%s}{%s}}",
          escapeFileName(tz.getID()), 
          escapeText(tz.getDisplayName(false, TimeZone.SHORT, locale)),
          escapeText(tz.getDisplayName(false, TimeZone.LONG, locale)),
          escapeText(tz.getDisplayName(true, TimeZone.SHORT, locale)),
          escapeText(tz.getDisplayName(true, TimeZone.LONG, locale))));
      }

      return builder.toString();
   }

    /**
     * Gets the current date in PDF format. (The same format as
     * \pdfcreationdate.)
     * @return The current date.
     */
   public String pdfnow()
   {
      Calendar cal = Calendar.getInstance();
      cal.setTimeInMillis(now.getTime());

      return pdfDate(cal);
   }

    /**
     * Gets the date in PDF format.
     * @param calendar A calendar object.
     * @return Date in PDF format.
     */
   public String pdfDate(Calendar calendar)
   {
       String tz = String.format("%1$tz", calendar);

       if (compatible < 2)
       {
          return String.format(
               "D:%1$tY%1$tm%1td%1$tH%1$tM%1$tS%2$s'%3$s'",
               calendar,
               tz.substring(0, 3),
               tz.substring(3));
       }
       else
       {
          // Need to ensure D : + or - and ' have category code 12
          // The simplest way to deal with this is to pass
          // everything after the "D" to escapeFileName since
          // the sign is hidden in the format.

          return String.format("\\pdfd %s",
             escapeFileName(
               String.format(
               ":%1$tY%1$tm%1td%1$tH%1$tM%1$tS%2$s'%3$s'",
               calendar,
               tz.substring(0, 3),
               tz.substring(3))
             )); 

       }
   }

   /**
    * Gets the date of a file in PDF format.
    * @param file File.
    * @return The date in PDF format.
    */
   public String pdfDate(File file)
   {
      try
      {
         if (!file.exists())
         {
            debug(String.format(
                 "Unable to get timestamp for file (no such file): %s",
                 file.toString()));
            return "";
         }

         if (!isReadPermitted(file))
         {
            debug(String.format("No read access for file: %s", file));
            return "";
         }
        
         long millisecs = file.lastModified();
            
         if (millisecs > ZERO)
         {
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(millisecs);

            return pdfDate(calendar);
         }

         // I/O error has occurred (already checked for file
         // existence and read permission, so it's something weird).
         // Perhaps the file is corrupt or the user has an eccentric OS that
         // doesn't support file modification timestamps.
         debug(String.format(
               "Unable to get timestamp for file (I/O error): %s",
               file.toString()));
      }
      catch (Exception exception)
      {
         // Catch all possible exceptions, including security
         // exception.

         debug(String.format(
              "Unable to get timestamp for file: %s",
              file.toString()),
              exception);
      }

      // Unsuccessful
      return "";
   }

    /**
     * Gets the file length in bytes.
     * @param file The file.
     * @return The length as a string.
     */
   public String getFileLength(File file)
   {
      try
      {
         if (!file.exists())
         {
            debug(String.format(
              "Unable to get the size of file (no such file): %s",
              file.toString()));
            return "";
         }
        
         if (!isReadPermitted(file))
         {
            debug(String.format("No read access for file: %s", file));
            return "";
         }
        
         return String.format("%d", file.length());

      }
      catch (Exception exception)
      {
         // Catch all possible exceptions, including security
         // exceptions.

         debug(String.format("Unable to get the size of file: %s",
               file.toString()),
               exception);
      }

      // Unsuccessful
      return "";
   }

   /**
    * Sort the given list of file names. Java 8 has a better sort
    * method so this is overridden in the TeXOSQueryJRE8 class.
    * @param list The list of file names to be sorted
    * @param directory The directory in which the files are
    * contained
    * @param sortType How to order the list
    */ 
    public void sortFileList(String[] list, File directory, 
      FileSortType sortType)
    {
       Arrays.sort(list, new FileSortComparator(directory, sortType));
    }

    /**
     * Checks the directory used for file listings. The JRE5 version
     * just returns the argument. The other versions convert the
     * directory to a canonical path and check it's permitted. (The
     * JRE7 and 8 versions are more restrictive.)
     */ 
    protected File checkDirectoryListing(File dir) throws IOException
    {
       return dir;
    }

    /**
     * Gets the list of files from a directory. This uses
     * getFilterFileList to filter out files prohibited by the
     * openin_any setting. Note that the separator isn't escaped as
     * the user may want some actual TeX code. For example, the
     * separator might need to be a double backslash.
     * The user will need to take the appropriate precautions
     * to protect it from expansion during the shell escape.
     * @param separator Separator.
     * @param directory Directory (root not permitted).
     * @param sortType How to sort the file list
     * @param listType The type of files to include in the list
     * @return List as a string.
     */
   public String getFileList(String separator, File directory, 
            FileSortType sortType, FileListType listType)
   {
      return getFilterFileList(separator, ".*", directory, sortType, listType);
   }

    /**
     * Gets a filtered list of files from directory.
     * Files with read access prohibited by openin_any or the OS are
     * omitted from the list. The regular expression is anchored,
     * so ".*foo" will only match file names that end with "foo".
     *
     * For security reasons, as from v1.2, the directory must have a
     * parent (otherwise malicious code could try to perform a
     * recursive search across the filing system, which would hog
     * resources). To allow for backward compatibility, the insecure
     * JRE5 version doesn't have this new restriction.
     *
     * @param separator Separator.
     * @param regex Regular expression.
     * @param directory Directory.
     * @param sortType How to sort the file list
     * @param listType The type of files to include in the list
     * @return Filtered list as string.
     */
   public String getFilterFileList(String separator,
            final String regex, File directory, 
            FileSortType sortType, final FileListType listType)
   {
      if (directory == null)
      {
         // shouldn't happen, but just in case...

         debug("Unable to list contents (null directory)");
         return "";
      }

      // Check for existence and that the given File is actually a directory.

      if (!directory.exists())
      {
         debug(String.format(
               "Unable to list contents (no such directory): %s",
               directory.toString()));
         return "";
      }

      if (!directory.isDirectory())
      {
         debug(String.format(
               "Unable to list contents (not a directory): %s",
               directory.toString()));
         return "";
      }

      try
      {
         // security check (converts to full canonical path with JRE7 or 8)

         directory = checkDirectoryListing(directory);
      }
      catch (Exception e)
      {
         debug(String.format("Unable to list contents of: %s",
                directory.getAbsolutePath()), e);
         return "";
      }

      if (!isReadPermitted(directory))
      {
         debug(String.format("No read access for directory: %s", directory));
         return "";
      }

      if ((regex == null) || ("".equals(regex)))
      {
         // null or empty regular expression forbidden (use ".*" for
         // all files, "" means only match a file with an empty
         // filename, which doesn't make much sense).

         debug("Null or empty regular expression in getFilterFileList");
         return "";
      }

      StringBuilder builder = new StringBuilder();
        
      try
      {
         String[] list = directory.list(
            new FilenameFilter()
            {
               @Override
               public boolean accept(File dir, String name)
               {
                  File file = new File(dir, name);
 
                  if (!isReadPermitted(file))
                  {
                     debug(String.format("No read access for file: %s", file));
                     return false;
                  }

                  switch (listType)
                  {
                     case FILE_LIST_DIRECTORIES_ONLY:

                        if (!file.isDirectory()) return false;

                     break;
                     case FILE_LIST_REGULAR_FILES_ONLY:

                        if (file.isDirectory()) return false;

                     break;
                  }

                  return name.matches(regex);
               }
            });

         if (list != null)
         {
            if (sortType != FileSortType.FILE_SORT_DEFAULT)
            {
               sortFileList(list, directory, sortType);
            }

            for (int i = 0; i < list.length; i++)
            {
               if (i > 0)
               {
                  builder.append(separator);
               }
                            
               if (list[i].contains(separator))
               {
                  builder.append(String.format("{%s}", escapeFileName(list[i])));
               }
               else
               {
                  builder.append(escapeFileName(list[i]));
               }
            }
                        
         }

         return builder.toString();
      }
      catch (Exception exception)
      {
         // Catch all possible exceptions
         debug(String.format("Unable to list contents of '%s' using regex: %s",
               directory.toString(), regex),
               exception);
      }

      // Unsuccessful
      return "";
   }

   /**
    * Recursive file listing. This method must have the CWD or a
    * descendent as the starting directory. It will return list of
    * files relative to the starting directory where the basename
    * matches the supplied regular expression. Hidden files/directories 
    * and symbolic links are skipped regardless of the openin_any setting.
    * Files without read access are also omitted from the list.
    *
    * This method requires the java.nio.file library, which was
    * introduced in Java 7, so this isn't available for the JRE5
    * version.
    *
    * @param separator separator to use in returned list
    * @param regex regular expression used to match file basenames
    * @param directory starting directory (must be cwd or a
    * descendent of cwd)
    * @return list of relative paths
    */ 
   public String walk(String separator,
            String regex, File directory, 
            FileSortType sortType)
   {
      debug("walk requires at least JRE 7 version");
      return "";
   }

    /**
     * Gets the file URI. 
     * @param file The file.
     * @return The URI.
     */
   public String fileURI(File file)
   {
      if (file == null)
      {
         // This shouldn't happen, but just in case...
         debug("null file passed to fileURI");
         return "";
      }

      if (!file.exists())
      {
         debug(String.format("can't obtain URI of file (no such file): %s",
            file.toString()));
         return "";
      }
        
      if (!isReadPermitted(file))
      {
         debug(String.format("No read access for file: %s", file));
         return "";
      }
        
      try
      {
         String uri = file.getCanonicalFile().toURI().toString();

         if (stripURIPrefix != null && uri.startsWith("file:/"+stripURIPrefix))
         {
            uri = "file:/"+uri.substring(6+stripURIPrefix.length());
         }
         else if (uriRegExp != null && uriReplacement != null)
         {
            uri = uri.replaceFirst(uriRegExp, uriReplacement);
         }

         return escapeFileName(uri);
      }
      catch (Exception exception)
      {
         debug(String.format("Can't obtain URI of file: %s", file.toString()),
          exception);
      }

      // Unsuccessful
      return "";
    }

    /**
     * Gets the full TeX file path name from File object.
     * @param file The file.
     * @return The path.
     */
   public String filePath(File file)
   {
      if (file == null)
      {
         // This shouldn't happen, but just in case...
         debug("null file passed to filePath");
         return "";
      }

      if (!file.exists())
      {
         debug(String.format(
           "Can't obtain full file path (no such file): %s",
           file.toString()));
         return "";
      }

      if (!isReadPermitted(file))
      {
          debug(String.format(
            "Can't obtain full file path (no read access): %s",
            file.toString()));
          return "";
      }

      try
      {
         return toTeXPath(file.getCanonicalPath());
      }
      catch (Exception exception)
      {
         debug(String.format(
           "Can't obtain full path for file: %s", file.toString()),
            exception);
      }

      // Unsuccessful
      return "";
    }

    /**
     * Gets the path for the file's parent.
     * @param file The file.
     * @return The path.
     * @since 1.1
     */
   public String parentPath(File file)
   {
      if (file == null)
      {
         // This shouldn't happen, but just in case...
         debug("null file passed to filePath");
         return "";
      }

      if (!file.exists())
      {
         debug(String.format(
           "Can't obtain full parent path for file (no such file): %s",
           file.toString()));
         return "";
      }

      if (!isReadPermitted(file))
      {
          debug(String.format(
            "Can't obtain full path for file (no read access): %s",
            file.toString()));
          return "";
      }

      try
      {
         File parent = file.getCanonicalFile().getParentFile();

         if (parent == null)
         {
            // No parent? If getCanonicalFile fails it throws an
            // exception, so no parent would presumably mean the
            // file's in the root directory.

            debug(String.format(
              "No parent found for file: %s", file.toString()));
            return "";
         }

         return toTeXPath(parent.getAbsolutePath());

      } 
      catch (Exception exception)
      {
         debug(String.format(
           "Can't obtain full parent path for file: %s", file.toString()),
           exception);
      }

      // Unsuccessful
      return "";
   }

   /**
    * Gets the script for the given locale. Java only introduced
    * support for language scripts in version 1.7, so this returns
    * null here. The Java 7 and 8 support needs to override this method.
    * @param locale The locale
    * @return The language script associated with the given locale or 
    * null if not available
    * @since 1.2
    */ 
   public String getScript(Locale locale)
   {
      return null;
   }

   /**
    * Gets the language tag for the given locale.
    * @param locale The locale or null for the default locale
    * @return The language tag
    * @since 1.2
    */ 
   public String getLanguageTag(Locale locale)
   {
      if (locale == null)
      {
         locale = Locale.getDefault();
      }

      String tag = locale.getLanguage();

      String country = locale.getCountry();

      if (country != null && !"".equals(country))
      {
         tag = String.format("%s-%s", tag, country);
      }

      String variant = locale.getVariant();

      if (variant != null && !"".equals(variant))
      {
         tag = String.format("%s-%s", tag, variant);
      }

      return tag;
   }

    /**
     * Gets a string representation of the provided locale.
     * @param locale The provided locale.
     * @return String representation.
     */
   public String getLocale(Locale locale)
   {
      return getLocale(locale, false);
   }

    /**
     * Gets a POSIX representation of the provided locale, converting the code
     * set if possible. If the boolean argument is true, this
     * attempts to convert the code set to a identifier that stands
     * a better chance of being recognised by inputenc.sty. For
     * example, UTF-8 will be converted to utf8. None of TeX's
     * special characters should occur in any of the locale
     * information, but we'd better treat it like a file name just in
     * case.
     * @param locale The provided locale.
     * @param convertCodeset Boolean value to convert the code set.
     * @return String representation.
     */
   public String getLocale(Locale locale, boolean convertCodeset)
   {
      String identifier = "";

      if (locale == null)
      {
         // No locale provided, return empty string
         debug("null locale");
         return "";
      }

      String language = locale.getLanguage();

      if (language == null)
      {
          // No language provided for the locale. The language
          // part will be omitted from the returned string.
         debug(String.format("No language for locale: %s", locale.toString()));
      }
      else
      {
         identifier = language;
      }

      String country = locale.getCountry();

      if (country == null || "".equals(country))
      {
         // No country is associated with the locale. The
         // country part will be omitted from the returned
         // string. This is just information, not an error.

         info(String.format("No region for locale: %s", locale.toString()));
      }
      else
      {
         if ("".equals(identifier))
         {
            // The identifier hasn't been set (no language
            // provided), so just set it to the country code.
            identifier = country;
         }
         else
         {
            // Append the country code to the identifier.
            identifier = identifier.concat("-").concat(country);
         }
      }

      String codeset = getCodeSet(convertCodeset);

      identifier = identifier.concat(".").concat(codeset);

      // Find the script if available. This is used as the modifier part
      // but it's better to use a language tag if the script is
      // needed.

      String script = getScript(locale);

      if (script == null || "".equals(script))
      {
         // Script information is missing. Ignore it.
         // This is just an advisory message.

         info(String.format("No script available for locale: %s",
             locale.toString()));
      }
      else
      {
         // Append the script. This will be a four letter string 
         // (if it's not empty).
         identifier = identifier.concat("@").concat(script);
      }

      return escapeFileName(identifier);
   }

   /**
    * Gets default file encoding. (Don't escape it here or it will cause
    * a problem when called in getLocale.)
    * @param convertCodeset If true convert codeset to fit
    * inputenc.sty
    * @return the file encoding.
    * @since 1.2
    */ 
   public String getCodeSet(boolean convertCodeset)
   {
      String codeset;

      if (fileEncoding != null)
      {
         codeset = fileEncoding;
      }
      else
      {
         // Get the OS default file encoding or "UTF-8" if not set.

         codeset = getSystemProperty("file.encoding", "UTF-8");

         // The codeset should not be null here as a default has
         // been provided if the property is missing.
      }

      if (convertCodeset)
      {
         // If conversion is required, change to lower case
         // and remove any hyphens.
         codeset = codeset.toLowerCase().replaceAll("-", "");
      }

      return codeset;
   }

   /**
    * Gets the two-letter alpha region code from the numeric code.
    * (Java doesn't seem to recognise the numeric codes.)
    * @param ISO 3166-1 numeric code
    * @return ISO 3166-1 alpha code
    * @since 1.2
    */ 
   public String getRegionAlpha2Code(int code)
   {
      switch (code)
      {
         case 4: return "AF";
         case 8: return "AL";
         case 10: return "AQ";
         case 12: return "DZ";
         case 16: return "AS";
         case 20: return "AD";
         case 24: return "AO";
         case 28: return "AG";
         case 31: return "AZ";
         case 32: return "AR";
         case 36: return "AU";
         case 40: return "AT";
         case 44: return "BS";
         case 48: return "BH";
         case 50: return "BD";
         case 51: return "AM";
         case 52: return "BB";
         case 56: return "BE";
         case 60: return "BM";
         case 64: return "BT";
         case 68: return "BO";
         case 70: return "BA";
         case 72: return "BW";
         case 74: return "BV";
         case 76: return "BR";
         case 84: return "BZ";
         case 86: return "IO";
         case 90: return "SB";
         case 92: return "VG";
         case 96: return "BN";
         case 100: return "BG";
         case 104: return "MM";
         case 108: return "BI";
         case 112: return "BY";
         case 116: return "KH";
         case 120: return "CM";
         case 124: return "CA";
         case 132: return "CV";
         case 136: return "KY";
         case 140: return "CF";
         case 144: return "LK";
         case 148: return "TD";
         case 152: return "CL";
         case 156: return "CN";
         case 158: return "TW";
         case 162: return "CX";
         case 166: return "CC";
         case 170: return "CO";
         case 174: return "KM";
         case 175: return "YT";
         case 178: return "CG";
         case 180: return "CD";
         case 184: return "CK";
         case 188: return "CR";
         case 191: return "HR";
         case 192: return "CU";
         case 196: return "CY";
         case 203: return "CZ";
         case 204: return "BJ";
         case 208: return "DK";
         case 212: return "DM";
         case 214: return "DO";
         case 218: return "EC";
         case 222: return "SV";
         case 226: return "GQ";
         case 231: return "ET";
         case 232: return "ER";
         case 233: return "EE";
         case 234: return "FO";
         case 238: return "FK";
         case 239: return "GS";
         case 242: return "FJ";
         case 246: return "FI";
         case 248: return "AX";
         case 250: return "FR";
         case 254: return "GF";
         case 258: return "PF";
         case 260: return "TF";
         case 262: return "DJ";
         case 266: return "GA";
         case 268: return "GE";
         case 270: return "GM";
         case 275: return "PS";
         case 276: return "DE";
         case 288: return "GH";
         case 292: return "GI";
         case 296: return "KI";
         case 300: return "GR";
         case 304: return "GL";
         case 308: return "GD";
         case 312: return "GP";
         case 316: return "GU";
         case 320: return "GT";
         case 324: return "GN";
         case 328: return "GY";
         case 332: return "HT";
         case 334: return "HM";
         case 336: return "VA";
         case 340: return "HN";
         case 344: return "HK";
         case 348: return "HU";
         case 352: return "IS";
         case 356: return "IN";
         case 360: return "ID";
         case 364: return "IR";
         case 368: return "IQ";
         case 372: return "IE";
         case 376: return "IL";
         case 380: return "IT";
         case 384: return "CI";
         case 388: return "JM";
         case 392: return "JP";
         case 398: return "KZ";
         case 400: return "JO";
         case 404: return "KE";
         case 408: return "KP";
         case 410: return "KR";
         case 414: return "KW";
         case 417: return "KG";
         case 418: return "LA";
         case 422: return "LB";
         case 426: return "LS";
         case 428: return "LV";
         case 430: return "LR";
         case 434: return "LY";
         case 438: return "LI";
         case 440: return "LT";
         case 442: return "LU";
         case 446: return "MO";
         case 450: return "MG";
         case 454: return "MW";
         case 458: return "MY";
         case 462: return "MV";
         case 466: return "ML";
         case 470: return "MT";
         case 474: return "MQ";
         case 478: return "MR";
         case 480: return "MU";
         case 484: return "MX";
         case 492: return "MC";
         case 496: return "MN";
         case 498: return "MD";
         case 499: return "ME";
         case 500: return "MS";
         case 504: return "MA";
         case 508: return "MZ";
         case 512: return "OM";
         case 516: return "NA";
         case 520: return "NR";
         case 524: return "NP";
         case 528: return "NL";
         case 531: return "CW";
         case 533: return "AW";
         case 534: return "SX";
         case 535: return "BQ";
         case 540: return "NC";
         case 548: return "VU";
         case 554: return "NZ";
         case 558: return "NI";
         case 562: return "NE";
         case 566: return "NG";
         case 570: return "NU";
         case 574: return "NF";
         case 578: return "NO";
         case 580: return "MP";
         case 581: return "UM";
         case 583: return "FM";
         case 584: return "MH";
         case 585: return "PW";
         case 586: return "PK";
         case 591: return "PA";
         case 598: return "PG";
         case 600: return "PY";
         case 604: return "PE";
         case 608: return "PH";
         case 612: return "PN";
         case 616: return "PL";
         case 620: return "PT";
         case 624: return "GW";
         case 626: return "TL";
         case 630: return "PR";
         case 634: return "QA";
         case 638: return "RE";
         case 642: return "RO";
         case 643: return "RU";
         case 646: return "RW";
         case 652: return "BL";
         case 654: return "SH";
         case 659: return "KN";
         case 660: return "AI";
         case 662: return "LC";
         case 663: return "MF";
         case 666: return "PM";
         case 670: return "VC";
         case 674: return "SM";
         case 678: return "ST";
         case 682: return "SA";
         case 686: return "SN";
         case 688: return "RS";
         case 690: return "SC";
         case 694: return "SL";
         case 702: return "SG";
         case 703: return "SK";
         case 704: return "VN";
         case 705: return "SI";
         case 706: return "SO";
         case 710: return "ZA";
         case 716: return "ZW";
         case 724: return "ES";
         case 728: return "SS";
         case 729: return "SD";
         case 732: return "EH";
         case 740: return "SR";
         case 744: return "SJ";
         case 748: return "SZ";
         case 752: return "SE";
         case 756: return "CH";
         case 760: return "SY";
         case 762: return "TJ";
         case 764: return "TH";
         case 768: return "TG";
         case 772: return "TK";
         case 776: return "TO";
         case 780: return "TT";
         case 784: return "AE";
         case 788: return "TN";
         case 792: return "TR";
         case 795: return "TM";
         case 796: return "TC";
         case 798: return "TV";
         case 800: return "UG";
         case 804: return "UA";
         case 807: return "MK";
         case 818: return "EG";
         case 826: return "GB";
         case 831: return "GG";
         case 832: return "JE";
         case 833: return "IM";
         case 834: return "TZ";
         case 840: return "US";
         case 850: return "VI";
         case 854: return "BF";
         case 858: return "UY";
         case 860: return "UZ";
         case 862: return "VE";
         case 876: return "WF";
         case 882: return "WS";
         case 887: return "YE";
         case 894: return "ZM";
      }

      // not recognised, return the code as a string
      debug(String.format("Unrecognised numeric region code: %d", code));
      return String.format("%d", code);
   }

   /**
    * Gets the locale from the given language tag. Since Java didn't
    * support BCP47 language tags until v1.7, we can't use
    * Locale.forLanguageTag(String) here. (The Java 7 and 8 support
    * will need to override this method.) Only parse for language
    * code, country code and variant. Grandfathered, irregular and private
    * tags not supported.
    * @param languageTag The language tag
    * @return The locale that closest matches the language tag
    * @since 1.2
    */ 
   public Locale getLocale(String languageTag)
   {
      // The BCP47 syntax is described in 
      // https://tools.ietf.org/html/bcp47#section-2.1
      // This is a match for a subset of the regular syntax.
      // Only the language tag, the region and the variant are
      // captured.
      // Note: named capturing groups was introduced in Java 7, so we
      // can't use them here.
      Pattern p = Pattern.compile(
        "(?:([a-z]{2,3}(?:-[a-z]{2,3})*))+(?:-[A-Z][a-z]{3})?(?:-([A-Z]{2}|[0-9]{3}))?(?:-([a-zA-Z0-9]{5,8}|[0-9][a-zA-Z0-9]{3}))?(?:-.)*");

      Matcher m = p.matcher(languageTag);

      if (m.matches())
      {
         String language = m.group(1);
         String region = m.group(2);
         String variant = m.group(3);

         try
         {
            region = getRegionAlpha2Code(Integer.parseInt(region));
         }
         catch (NumberFormatException e)
         {
            // ignore, alpha region code was supplied
         }

         // Language won't be null as the pattern requires it, but
         // the region and variant might be.

         if (region == null)
         {
            // There isn't a Locale constructor that allows a
            // variant without a region, so don't bother checking
            // variant for null here.

            return new Locale(language);
         }

         if (variant == null)
         {
            return new Locale(language, region);
         }

         return new Locale(language, region, variant);
      }

      debug(String.format("Can't parse language tag: %s", languageTag));

      // strip anything to a hyphen and try that
      String[] split = languageTag.split("-", 1);

      return new Locale(split[0]);
   }

   /**
    * Gets all numerical information for the given locale. If the
    * given locale tag is null or empty, the default locale is used. The
    * information is returned with each item grouped to make it
    * easier to parse in TeX. This is an abridged version of
    * getLocaleData().
    * @param localeTag the tag identifying the locale or null for
    * the default locale
    * @return locale numerical information: language tag, 
    * number group separator, decimal separator, exponent separator,
    * grouping conditional (1 if locale uses number grouping
    * otherwise 0),
    * currency code (e.g. GBP), regional currency identifier (e.g. IMP),
    * currency symbol (e.g. \\twrp{&0x00A3;}), currency TeX code (e.g.
    * \\texosquerycurrency{pound}), monetary decimal separator.
    * @since 1.2
    */
   public String getNumericalInfo(String localeTag)
   {
       Locale locale;

       if (localeTag == null || "".equals(localeTag))
       {
          locale = Locale.getDefault();
       }
       else
       {
          locale = getLocale(localeTag);
       }

       DecimalFormatSymbols fmtSyms 
               = DecimalFormatSymbols.getInstance(locale);

       // ISO 4217 code
       String currencyCode = fmtSyms.getInternationalCurrencySymbol();

       // Currency symbol
       String currency = fmtSyms.getCurrencySymbol();

       // Check for known unofficial currency codes

       String localeCurrencyCode = currencyCode;

       String countryCode = locale.getCountry();

       if (countryCode != null && !"".equals(countryCode))
       {
          if (countryCode.equals("GG") || countryCode.equals("GGY")
           || countryCode.equals("831"))
          {// Guernsey
             localeCurrencyCode = "GGP";
             currency = POUND_STRING;
          }
          else if (countryCode.equals("JE") || countryCode.equals("JEY")
           || countryCode.equals("832"))
          {// Jersey
             localeCurrencyCode = "JEP";
             currency = POUND_STRING;
          }
          else if (countryCode.equals("IM") || countryCode.equals("IMN")
           || countryCode.equals("833"))
          {// Isle of Man
             localeCurrencyCode = "IMP";
             currency = String.format("M%s", POUND_STRING);
          }
          else if (countryCode.equals("KI") || countryCode.equals("KIR")
           || countryCode.equals("296"))
          {// Kiribati
             localeCurrencyCode = "KID";
             currency = "$";
          }
          else if (countryCode.equals("TV") || countryCode.equals("TUV")
           || countryCode.equals("798"))
          {// Tuvaluan
             localeCurrencyCode = "TVD";
             currency = "$";
          }
          // Transnistrian ruble omitted as it conflicts with ISO
          // 4217 so omitted. There's also no country code for
          // Transnistria. Other currencies don't have an associated
          // region code (for example, Somaliland) or don't have a
          // known unofficial currency code (for example, Alderney).
       }

       // Convert known Unicode currency symbols to commands that
       // may be redefined in TeX

       String texCurrency = getTeXCurrency(currency);

       NumberFormat numFormat = NumberFormat.getNumberInstance(locale);

       // Currency codes should always be three letter upper case
       // A-Z characters, so no need to escape them.

       return String.format(
         "{%s}{%s}{%s}{%s}{%d}{%s}{%s}{%s}{%s}{%s}",
             escapeFileName(getLanguageTag(locale)),
             escapeText(fmtSyms.getGroupingSeparator()),
             escapeText(fmtSyms.getDecimalSeparator()),
             escapeText(fmtSyms.getExponentSeparator()), 
             numFormat.isGroupingUsed() ? 1 : 0,
             currencyCode,
             localeCurrencyCode,
             escapeText(currency),
             texCurrency,// already escaped
             escapeText(fmtSyms.getMonetaryDecimalSeparator()));
   }

   /**
    * Gets the currency with known symbols replaced by TeX commands
    * provided by texosquery.tex. Some of the conditions in this
    * method test for archaic currency symbols. It seems very
    * unlikely that any of those cases would actually occur, but
    * they're included for completeness.
    * @param currency The original currency string 
    * @return The TeX version
    * @since 1.2
    */ 
   public String getTeXCurrency(String currency)
   {
      StringBuilder builder = new StringBuilder();

      for (int i = 0, n = currency.length(); i < n; )
      {
         int codepoint = currency.codePointAt(i);
         i += Character.charCount(codepoint);

         switch (codepoint)
         {
            case DOLLAR_CHAR:
               builder.append("\\texosquerycurrency{dollar}");
            break;
            case CENT_CHAR:
               builder.append("\\texosquerycurrency{cent}");
            break;
            case POUND_CHAR:
               builder.append("\\texosquerycurrency{pound}");
            break;
            case CURRENCY_CHAR:
               builder.append("\\texosquerycurrency{sign}");
            break;
            case YEN_CHAR:
               builder.append("\\texosquerycurrency{yen}");
            break;
            case ECU_CHAR:
               builder.append("\\texosquerycurrency{ecu}");
            break;
            case COLON_CURRENCY_CHAR:
               builder.append("\\texosquerycurrency{colon}");
            break;
            case CRUZEIRO_CHAR:
               builder.append("\\texosquerycurrency{cruzeiro}");
            break;
            case FRANC_CHAR:
               builder.append("\\texosquerycurrency{franc}");
            break;
            case LIRA_CHAR:
               builder.append("\\texosquerycurrency{lira}");
            break;
            case MILL_CURRENCY_CHAR:
               builder.append("\\texosquerycurrency{mill}");
            break;
            case NAIRA_CHAR:
               builder.append("\\texosquerycurrency{naira}");
            break;
            case PESETA_CHAR:
               builder.append("\\texosquerycurrency{peseta}");
            break;
            case LEGACY_RUPEE_CHAR:
            case RUPEE_CHAR:
               builder.append("\\texosquerycurrency{rupee}");
            break;
            case WON_CHAR:
               builder.append("\\texosquerycurrency{won}");
            break;
            case NEW_SHEQEL_CHAR:
               builder.append("\\texosquerycurrency{newsheqel}");
            break;
            case DONG_CHAR:
               builder.append("\\texosquerycurrency{dong}");
            break;
            case EURO_CHAR:
               builder.append("\\texosquerycurrency{euro}");
            break;
            case KIP_CHAR:
               builder.append("\\texosquerycurrency{kip}");
            break;
            case TUGRIK_CHAR:
               builder.append("\\texosquerycurrency{tugrik}");
            break;
            case DRACHMA_CHAR:
               builder.append("\\texosquerycurrency{drachma}");
            break;
            case GERMAN_PENNY_CHAR:
               builder.append("\\texosquerycurrency{germanpenny}");
            break;
            case PESO_CHAR:
               builder.append("\\texosquerycurrency{peso}");
            break;
            case GUARANI_CHAR:
               builder.append("\\texosquerycurrency{guarani}");
            break;
            case AUSTRAL_CHAR:
               builder.append("\\texosquerycurrency{austral}");
            break;
            case HRYVNIA_CHAR:
               builder.append("\\texosquerycurrency{hryvnia}");
            break;
            case CEDI_CHAR:
               builder.append("\\texosquerycurrency{cedi}");
            break;
            case LIVRE_TOURNOIS_CHAR:
               builder.append("\\texosquerycurrency{livretournois}");
            break;
            case SPESMILO_CHAR:
               builder.append("\\texosquerycurrency{spesmilo}");
            break;
            case TENGE_CHAR:
               builder.append("\\texosquerycurrency{tenge}");
            break;
            case TURKISH_LIRA_CHAR:
               builder.append("\\texosquerycurrency{turkishlira}");
            break;
            case NORDIC_MARK_CHAR:
               builder.append("\\texosquerycurrency{nordicmark}");
            break;
            case MANAT_CHAR:
               builder.append("\\texosquerycurrency{manat}");
            break;
            case RUBLE_CHAR:
               builder.append("\\texosquerycurrency{ruble}");
            break;
            default: 
               builder.append(escapeText(codepoint));
         }
      }

      return builder.toString();
   }

   /** Gets the standalone month names for the locale data.
    * These are only available for Java 8, so just return the 
    * month names used in the date format instead. The JRE8 version
    * needs to override this method.
    * @param cal The calendar
    * @param locale The locale
    * @return month names
    * @since 1.2
    */  
   public String getStandaloneMonths(Calendar cal, Locale locale)
   {
      // can't use Calendar.getDisplayName() as it's not available
      // with Java 5.
      DateFormatSymbols dateFmtSyms = DateFormatSymbols.getInstance(locale);

      StringBuilder monthNamesGroup = new StringBuilder();

      String[] names = dateFmtSyms.getMonths();

      for (int i = 0; i < 12; i++)
      {
         monthNamesGroup.append(String.format("{%s}", escapeText(names[i])));
      }

      return monthNamesGroup.toString();
   }

   /** Gets the standalone short month names for the locale data.
    * These are only available for Java 8, so just return the 
    * month names used in the date format instead. The JRE8 version
    * needs to override this method.
    * @param cal The calendar
    * @param locale The locale
    * @return short month names
    * @since 1.2
    */  
   public String getStandaloneShortMonths(Calendar cal, Locale locale)
   {
      // can't use Calendar.getDisplayName() as it's not available
      // with Java 5.
      DateFormatSymbols dateFmtSyms = DateFormatSymbols.getInstance(locale);

      StringBuilder shortMonthNamesGroup = new StringBuilder();

      String[] names = dateFmtSyms.getShortMonths();

      for (int i = 0; i < 12; i++)
      {
         shortMonthNamesGroup.append(String.format("{%s}", 
           escapeText(names[i])));
      }

      return shortMonthNamesGroup.toString();
   }

   /** Gets the standalone day names for the locale data.
    * These are only available for Java 8, so just return the 
    * names used in the date format instead. The JRE8 version
    * needs to override this method.
    * @param cal The calendar
    * @param locale The locale
    * @return day of week names
    * @since 1.2
    */  
   public String getStandaloneWeekdays(Calendar cal, Locale locale)
   {
      DateFormatSymbols dateFmtSyms = DateFormatSymbols.getInstance(locale);

      String[] names = dateFmtSyms.getWeekdays();

      // Be consistent with pgfcalendar:

      return String.format("{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
          escapeText(names[Calendar.MONDAY]),
          escapeText(names[Calendar.TUESDAY]),
          escapeText(names[Calendar.WEDNESDAY]),
          escapeText(names[Calendar.THURSDAY]),
          escapeText(names[Calendar.FRIDAY]),
          escapeText(names[Calendar.SATURDAY]),
          escapeText(names[Calendar.SUNDAY]));
   }

   /** Gets the standalone short day names for the locale data.
    * These are only available for Java 8, so just return the 
    * names used in the date format instead. The JRE8 version
    * needs to override this method.
    * @param cal The calendar
    * @param locale The locale
    * @return day of week names
    * @since 1.2
    */  
   public String getStandaloneShortWeekdays(Calendar cal, Locale locale)
   {
      DateFormatSymbols dateFmtSyms = DateFormatSymbols.getInstance(locale);

      String[] names = dateFmtSyms.getShortWeekdays();

      // Be consistent with pgfcalendar:

      return String.format("{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
          escapeText(names[Calendar.MONDAY]),
          escapeText(names[Calendar.TUESDAY]),
          escapeText(names[Calendar.WEDNESDAY]),
          escapeText(names[Calendar.THURSDAY]),
          escapeText(names[Calendar.FRIDAY]),
          escapeText(names[Calendar.SATURDAY]),
          escapeText(names[Calendar.SUNDAY]));
   }

   /**
    * Converts date/time pattern to a form that's easier for TeX to
    * parse. This replaces the placeholders with <tt>\\patdtf{n}{c}</tt> where c
    * is the placeholder character and n is the number of
    * occurrences of c in the placeholder. (For example, 
    * "<tt>dd-MMM-yyyy</tt>" is  converted to
    * <tt>\\patdtf{2}{d}-\\patdtf{3}{M}-\\patdtf{4}{y}</tt>). The 
    * query command \\TeXOSQuery in texosquery.tex will expand \\patdtf
    * to the longer \\texosquerydtf to avoid conflict. This can then be
    * redefined as appropriate. (See the "Pattern Formats" section
    * of the TeX documented code for more detail.)
    * @param localeFormat The date/time pattern
    * @return TeX code
    * @since 1.2
    */ 
   public String formatDateTimePattern(Format localeFormat)
   {
      SimpleDateFormat fmt = null;

      try
      {
         fmt = (SimpleDateFormat)localeFormat;

         if (fmt == null)
         {
            throw new NullPointerException();
         }
      }
      catch (Exception e)
      {
         // this shouldn't happen
         debug(String.format("Invalid argument: %s", localeFormat), e);
         return "";
      }

      String pattern = fmt.toPattern();

      StringBuilder builder = new StringBuilder();

      int prev = 0;
      int fieldLen = 0;
      boolean inString = false;

      for (int i = 0, n = pattern.length(), offset=1; i < n; i = i+offset)
      {
         int codepoint = pattern.codePointAt(i);
         offset = Character.charCount(codepoint);

         int nextIndex = i+offset;
         int nextCodePoint = (nextIndex < n ? pattern.codePointAt(nextIndex):0);

         if (inString)
         {
            if (codepoint == '\'')
            {
               if (nextCodePoint != '\'')
               {
                  // reached the end of the string
                  builder.append('}');
                  inString = false;
               }
               else
               {
                  // literal '
                  builder.append("\\patapo ");
                  i = nextIndex;
                  offset = Character.charCount(nextCodePoint);
               }
            }
            else
            {
               // still inside the string
               builder.append(escapeText(codepoint));
            }
         }
         else if (codepoint == prev)
         {
            fieldLen++;
         }
         else
         {
            switch (codepoint)
            {
               case '\'': // quote

                  if (prev != 0)
                  {
                     builder.append(String.format(
                         "\\patdtf{%d}{%c}", fieldLen, prev));
                     prev = 0;
                     fieldLen = 0;
                  }

                  // start of the string
                  builder.append("\\patstr{");
                  inString = true;

               break;
               case 'G': // era
               case 'y': // year
               case 'Y': // week year
               case 'M': // month in year (context sensitive)
               case 'L': // month in year (standalone)
               case 'w': // week in year
               case 'W': // week in month
               case 'D': // day in year
               case 'd': // day in month
               case 'F': // day of week in month
               case 'E': // day name in week
               case 'u': // day number of week (1 = Mon)
               case 'a': // am/pm marker
               case 'H': // hour in day (0-23)
               case 'k': // hour in day (1-24)
               case 'K': // hour in am/pm (0-11)
               case 'h': // hour in am/pm (1-12)
               case 'm': // minute in hour
               case 's': // second in minute
               case 'S': // millisecond
               case 'z': // time zone (locale)
               case 'Z': // time zone (RFC 822)
               case 'X': // time zone (ISO 8601)
                 prev = codepoint;
                 fieldLen = 1;
               break;
               default:
                 // prev doesn't need escaping as it will be one
                 // of the above letter cases.

                 if (prev == 0)
                 {
                     builder.append(escapeText(codepoint));
                 }
                 else
                 {
                     builder.append(String.format(
                       "\\patdtf{%d}{%c}%s", fieldLen, prev, 
                       escapeText(codepoint)));
                 }
                 prev = 0;
                 fieldLen = 0;
            }
         }
      }

      if (prev != 0)
      {
         builder.append(String.format(
           "\\patdtf{%d}{%c}", fieldLen, prev));
      }

      return builder.toString();
   }

   /**
    * Converts numeric pattern to a form that's easier for TeX to parse. 
    * @param numFormat the numeric pattern
    * @return TeX code
    * @since 1.2
    */ 
   public String formatNumberPattern(Format numFormat)
   {
      DecimalFormat fmt = null;

      try
      {
         fmt = (DecimalFormat)numFormat;

         if (fmt == null)
         {
            throw new NullPointerException();
         }
      }
      catch (Exception e)
      {
         // this shouldn't happen
         debug(String.format("Invalid argument: %s", numFormat), e);
         return "";
      }

      String pattern = fmt.toPattern();

      // Is there a +ve;-ve sub-pattern pair?
      // This is a bit awkward as a semi-colon could appear
      // literally within a string.

      String positive = null;
      String negative = null;

      StringBuilder builder = new StringBuilder();
      boolean inString = false;

      for (int i = 0, n = pattern.length(), offset=1; i < n; i = i+offset)
      {
         int codepoint = pattern.codePointAt(i);
         offset = Character.charCount(codepoint);

         int nextIndex = i+offset;
         int nextCodePoint = (nextIndex < n ? pattern.codePointAt(nextIndex):0);

         if (inString)
         {
            if (codepoint == '\'')
            {
               builder.appendCodePoint(codepoint);

               if (nextCodePoint == '\'')
               {
                  // literal '
                  builder.appendCodePoint(nextCodePoint);
                  i = nextIndex;
                  offset = Character.charCount(nextCodePoint);
               }
               else
               {
                  inString = false;
               }
            }
            else
            {
               builder.appendCodePoint(codepoint);
            }
         }
         else if (codepoint == '\'')
         {
            inString = true;
            builder.appendCodePoint(codepoint);
         }
         else if (codepoint == ';')
         {
            if (positive == null)
            {
               positive = builder.toString();
               builder = new StringBuilder();
            }
            else
            {
               debug(String.format("Too many ; found in pattern: %s", 
                     pattern));
            }
         }
         else
         {
            builder.appendCodePoint(codepoint);
         }
      }

      if (positive == null)
      {
         positive = builder.toString();
      }
      else if (builder.length() > 0)
      {
         negative = builder.toString();
      }

      if (negative == null)
      {
         return String.format("\\patnumfmt{%s}", 
           formatNumberSubPattern(positive));
      }
      else
      {
         return String.format("\\patpmnumfmt{%s}{%s}", 
           formatNumberSubPattern(positive),
           formatNumberSubPattern(negative));
      }
   }

   /**
    * Converts the sub-pattern of a numeric format.
    * @param pattern The sub-pattern
    * @return TeX code
    * @since 1.2
    */ 
   private String formatNumberSubPattern(String pattern)
   {
      if (pattern == null || "".equals(pattern))
      {
         return "";
      }

      // Is this currency?

      Pattern p = Pattern.compile("(.*(?:[^'](?:'')+){0,1})("+CURRENCY_CHAR
        +"{1,2})(.*)");
      Matcher m = p.matcher(pattern);

      if (m.matches())
      {
         return formatCurrencyPattern(m.group(1), 
           (m.group(2).length() == 2), m.group(3));
      }

      // Is this a percentage?

      p = Pattern.compile("(.*(?:[^'](?:'')+){0,1})([%"+PERMILLE_CHAR+"])(.*)");
      m = p.matcher(pattern);

      if (m.matches())
      {
         boolean percent = ("%".equals(m.group(2)));

         return formatPercentagePattern(m.group(1), m.group(3),
          percent ? "patppct" : "patppml", 
          percent ? "patspct" : "patspml");
      }

      // must be a number

      return formatNumericPattern(pattern);
   }

   /**
    * Converts the currency format.
    * @param pre The pre-symbol pattern
    * @param international Determines if the international currency
    * symbol should be used
    * @param post The post-symbol pattern
    * @return TeX code
    * @since 1.2
    */ 
   private String formatCurrencyPattern(String pre, boolean international,
      String post)
   {
      if (post == null || "".equals(post))
      {
         pre = formatNumericPattern(pre);

         // currency symbol is a suffix
         if (international)
         {
            return String.format("\\patsicur{%s}{}", pre);
         }
         else
         {
            return String.format("\\patscur{%s}{}", pre);
         }
      }
      else if (pre == null || "".equals(pre))
      {
         // currency symbol is a prefix

         post = formatNumericPattern(post);

         if (international)
         {
            return String.format("\\patpicur{%s}{}", post);
         }
         else
         {
            return String.format("\\patpcur{%s}{}", post);
         }
      }
      else
      {
         // What do we do here? If pre contains '#' or '0' assume
         // a suffix currency otherwise a prefix currency.

         pre = formatNumericPattern(pre);
         post = formatNumericPattern(post);

         if (pre.matches(".*[0#].*"))
         {
            // suffix, pre is the number and post is trailing
            // text
            if (international)
            {
               return String.format("\\patsicur{%s}{%s}", pre, post);
            }
            else
            {
               return String.format("\\patscur{%s}{%s}", pre, post);
            }
         }
         else
         {
            // prefix, post is the number and pre is leading
            // text
            if (international)
            {
               return String.format("\\patpicur{%s}{%s}", post, pre);
            }
            else
            {
               return String.format("\\patpcur{%s}{%s}", post, pre);
            }
         }
      }
   }

   /**
    * Converts percentage format.
    * @param pre The pre-symbol pattern
    * @param post The post-symbol pattern
    * @param prefixCs The control sequence name to use if the symbol is a
    * prefix
    * @param suffixCs The control sequence name to use if the symbol is a
    * suffix
    * @return TeX code
    * @since 1.2
    */ 
   private String formatPercentagePattern(String pre, String post,
     String prefixCs, String suffixCs)
   {
      if (post == null || "".equals(post))
      {
         pre = formatNumericPattern(pre);

         // symbol is a suffix

         return String.format("\\%s{%s}{}", suffixCs, pre);
      }
      else if (pre == null || "".equals(pre))
      {
         // symbol is a prefix

         post = formatNumericPattern(post);

         return String.format("\\%s{%s}{}", prefixCs, post);
      }
      else
      {
         pre = formatNumericPattern(pre);
         post = formatNumericPattern(post);

         if (pre.matches(".*[0#].*"))
         {
            // suffix, pre is the number and post is trailing
            // text

            return String.format("\\%s{%s}{%s}", suffixCs, pre, post);
         }
         else
         {
            // prefix, post is the number and pre is leading
            // text

            return String.format("\\%s{%s}{%s}", prefixCs, post, pre);
         }
      }
   }

   /**
    * Converts the numeric format.
    * @param pattern The sub-pattern
    * @return TeX code
    * @since 1.2
    */ 
   private String formatNumericPattern(String pattern)
   {
      if (pattern == null || "".equals(pattern))
      {
         return "";
      }

      // Split around exponent (if present)

      Pattern p = Pattern.compile("(.*(?:[^'](?:'')+?){0,1})(E.*)?");
      Matcher m = p.matcher(pattern);

      if (!m.matches())
      {
         debug(String.format(
             "Can't match number format sub-pattern '%s' against regexp: %s",
              pattern, p));
         return "";
      } 

      String pre = m.group(1);
      String post = m.group(2);

      if (pre == null && post == null)
      {
         // empty pattern
         return "";
      }

      if (post == null)
      {
         return formatDecimalPattern(pre);
      }

      return String.format("\\patsinumfmt{%s}{%s}",
        formatDecimalPattern(pre),
        formatIntegerPattern(post, true));
   }

   /**
    * Converts a decimal pattern.
    * @param pattern The pattern
    * @return TeX code
    * @since 1.2
    */ 
   private String formatDecimalPattern(String pattern)
   {
      // split on the decimal point (if present)

      Pattern p = Pattern.compile("(.*?(?:[^'](?:'')){0,1})(?:\\.(.*))?");

      Matcher m = p.matcher(pattern);

      if (!m.matches())
      {
         debug(String.format(
             "Can't match decimal pattern '%s' against regexp: %s",
              pattern, p));
         return "";
      } 


      String pre = m.group(1);
      String post = m.group(2);

      if (pre == null && post == null)
      {
         // empty pattern
         return "";
      }

      if (post == null)
      {
         return formatIntegerPattern(pre, true);
      }

      return String.format("\\patdecfmt{%s}{%s}",
        formatIntegerPattern(pre, true),
        formatIntegerPattern(post, false));
   }


   /**
    * Convert an integer pattern. The aim here is to have a number
    * formatting command defined in TeX that will be passed a number
    * with either leading or trailing zeros padded to 10 digits.
    * TeX can't handle numbers higher than 2147483647, so any digits
    * in the pattern beyond that are discarded. This means defining
    * a command that effectively takes 10 arguments (with a bit of
    * trickery to get around the 9-arg maximum). Each digit can then
    * be rendered using either \\patdgt (always display the digit)
    * or \\patdgtnz (only display the digit if it isn't a
    * non-significant zero).
    *
    * These short commands will be converted to longer ones that are
    * less likely to cause conflict when \\TeXOSQuery is used.
    * (See the "Pattern Formats" section of the documented code for
    * more details.)
    * @param pattern The pattern
    * @param leadPadding Determines if leading padding needs taking
    * into account
    * @return TeX code
    * @since 1.2
    */ 
   private String formatIntegerPattern(String pattern, boolean leadPadding)
   {
      boolean inString = false;

      int digitCount = 0;
      int groupCount = -1;

      // count the number of digits

      for (int i = 0, n = pattern.length(), offset=1; i < n; i = i+offset)
      {
         int codepoint = pattern.codePointAt(i);
         offset = Character.charCount(codepoint);

         int nextIndex = i+offset;
         int nextCodePoint = (nextIndex < n ? pattern.codePointAt(nextIndex):0);

         if (inString)
         {
            if (codepoint == '\'')
            {
               if (nextCodePoint != '\'')
               {
                  inString = false;
                  i = nextIndex;
                  offset = Character.charCount(nextCodePoint);
               }
            }
         }
         else if (codepoint == '\'')
         {
            inString = true;
         }
         else if (codepoint == '#' || codepoint == '0')
         {
            digitCount++;

            if (groupCount > -1) groupCount++;
         }
         else if (codepoint == ',')
         {
            groupCount=0;
         }
      }

      int digitIndex = (leadPadding ? MAX_DIGIT_FORMAT : 0);

      inString = false;

      StringBuilder builder = new StringBuilder();

      for (int i = 0, n = pattern.length(), offset=1; i < n; i = i+offset)
      {
         int codepoint = pattern.codePointAt(i);
         offset = Character.charCount(codepoint);

         int nextIndex = i+offset;
         int nextCodePoint = (nextIndex < n ? pattern.codePointAt(nextIndex):0);

         switch (codepoint)
         {
            case '\'':

              if (!inString)
              {
                 inString = true;

                 builder.append("\\patstr{");
              }
              else if (nextCodePoint == '\'')
              {
                 builder.append("\\patapo ");
                 i = nextIndex;
                 offset = Character.charCount(nextCodePoint);
              }
              else
              {
                 builder.append("}");
                 inString = false;
              }
            break;
            case '0':

              if (leadPadding)
              {
                 if (digitIndex > MAX_DIGIT_FORMAT)
                 {
                    // too many digit markers in the pattern,
                    // discard
                 }
                 else if (digitIndex > digitCount)
                 {
                    // not enough digit markers in the pattern
                    // pad with #

                    for ( ; digitIndex > digitCount; digitIndex--)
                    {
                       builder.append("\\patdgtnz ");

                       if (groupCount > 0 && ((digitIndex-1) % groupCount) == 0)
                       {
                          builder.append("\\patngp ");
                       }
                    }

                    builder.append("\\patdgt ");
                 }
                 else
                 {
                    builder.append("\\patdgt ");
                 }

                 digitIndex--;
              }
              else
              {
                 digitIndex++;

                 if (digitIndex > MAX_DIGIT_FORMAT)
                 {
                    // too many digit markers in the pattern,
                    // discard
                 }
                 else if (digitIndex == digitCount)
                 {
                    builder.append("\\patdgt ");

                    // not enough digit markers in the pattern
                    // pad with #

                    for ( ; digitIndex < MAX_DIGIT_FORMAT; digitIndex++)
                    {
                       builder.append("\\patdgtnz ");
                    }
                 }
                 else
                 {
                    builder.append("\\patdgt ");
                 }
              }
            break;
            case '#':

              if (leadPadding)
              {
                 if (digitIndex > MAX_DIGIT_FORMAT)
                 {
                    // too many digit markers in the pattern,
                    // discard
                 }
                 else if (digitIndex > digitCount)
                 {
                    // not enough digit markers in the pattern
                    // pad with #

                    for ( ; digitIndex > digitCount; digitIndex--)
                    {
                       builder.append("\\patdgtnz ");

                       if (groupCount > 0 && ((digitIndex-1) % groupCount) == 0)
                       {
                          builder.append("\\patngp ");
                       }
                    }

                    builder.append("\\patdgtnz ");
                 }
                 else
                 {
                    builder.append("\\patdgtnz ");
                 }

                 digitIndex--;
              }
              else
              {
                 digitIndex++;

                 if (digitIndex > MAX_DIGIT_FORMAT)
                 {
                    // too many digit markers in the pattern,
                    // discard
                 }
                 else if (digitIndex == digitCount)
                 {
                    builder.append("\\patdgtnz ");

                    // not enough digit markers in the pattern
                    // pad with #

                    for ( ; digitIndex < MAX_DIGIT_FORMAT; digitIndex++)
                    {
                       builder.append("\\patdgtnz ");
                    }
                 }
                 else
                 {
                    builder.append("\\patdgtnz ");
                 }
              }
            break;
            case '-':
              builder.append("\\patmsg ");
            break;
            case ',':

              if (digitIndex <= digitCount)
              {
                 builder.append("\\patngp ");
              }

            break;
            default:
              builder.append(escapeText(codepoint));
         }
      }

      return builder.toString();
   }

   /**
    * Gets all available data for the given locale. If the
    * given locale tag is null, the default locale is used. The
    * information is returned with grouping to make it
    * easier to parse in TeX. (Each block is grouped, with each
    * element within the block also grouped.)
    *
    * The standalone month names and day of week names are new
    * to Java 8, so we can't use them for earlier versions.
    * @param localeTag the language tag identifying the locale or null for
    * the default locale
    * @return locale data in grouped blocks:
    * <ol>
    * <li>language tag, language name, language name in given locale,
    * country name, country name in given locale, variant name,
    * variant name in given locale.
    * <li> full date, long date, medium date, short date,
    * first day of the week index.
    * <li> full date, long date, medium date, short date patterns.
    * <li> full time, long time, medium time, short time.
    * <li> full time, long time, medium time, short time patterns.
    * <li> weekday names.
    * <li> short weekday names.
    * <li> month names
    * <li> short month names.
    * <li> standalone week day names.
    * <li> standalone short week day names.
    * <li> standalone month names.
    * <li> standalone short month names.
    * <li> number group separator,
    * decimal separator, exponent separator, grouping flag, ISO 4217 currency
    * identifier (e.g. GBP), region currency identifier (usually the same as
    * the ISO 4217 code, but may be an unofficial currency code, such as IMP),
    * currency symbol (e.g. &0x00A3;), TeX currency symbol, monetary decimal 
    * separator, percent symbol, per mille symbol.
    * <li> number format, integer format, currency format,
    * percent format.
    * </ol>
    * @since 1.2
    */
   public String getLocaleData(String localeTag)
   {
       Locale locale;

       if (localeTag == null || "".equals(localeTag))
       {
          locale = Locale.getDefault();
       }
       else
       {
          locale = getLocale(localeTag);
       }

       String languageName = locale.getDisplayLanguage();

       if (languageName == null)
       {
          languageName = "";
       }

       String localeLanguageName = locale.getDisplayLanguage(locale);

       if (localeLanguageName == null)
       {
          localeLanguageName = "";
       }

       String countryName = locale.getDisplayCountry();

       if (countryName == null)
       {
          countryName = "";
       }

       String localeCountryName = locale.getDisplayCountry(locale);

       if (localeCountryName == null)
       {
          localeCountryName = "";
       }

       String variantName = locale.getDisplayVariant();

       if (variantName == null)
       {
          variantName = "";
       }

       String localeVariantName = locale.getDisplayVariant(locale);

       if (localeVariantName == null)
       {
          localeVariantName = "";
       }

       String langRegionGroup = String.format("{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
             escapeFileName(getLanguageTag(locale)),
             escapeText(languageName),
             escapeText(localeLanguageName),
             escapeText(countryName),
             escapeText(localeCountryName),
             escapeText(variantName),
             escapeText(localeVariantName));

       DateFormat dateFullFormat = DateFormat.getDateInstance(
        DateFormat.FULL, locale);

       DateFormat dateLongFormat = DateFormat.getDateInstance(
        DateFormat.LONG, locale);

       DateFormat dateMediumFormat = DateFormat.getDateInstance(
        DateFormat.MEDIUM, locale);

       DateFormat dateShortFormat = DateFormat.getDateInstance(
        DateFormat.SHORT, locale);

       DateFormat timeFullFormat = DateFormat.getTimeInstance(
        DateFormat.FULL, locale);

       DateFormat timeLongFormat = DateFormat.getTimeInstance(
        DateFormat.LONG, locale);

       DateFormat timeMediumFormat = DateFormat.getTimeInstance(
        DateFormat.MEDIUM, locale);

       DateFormat timeShortFormat = DateFormat.getTimeInstance(
        DateFormat.SHORT, locale);

       DateFormat dateTimeFullFormat = DateFormat.getDateTimeInstance(
        DateFormat.FULL, DateFormat.FULL, locale);

       DateFormat dateTimeLongFormat = DateFormat.getDateTimeInstance(
        DateFormat.LONG, DateFormat.LONG, locale);

       DateFormat dateTimeMediumFormat = DateFormat.getDateTimeInstance(
        DateFormat.MEDIUM, DateFormat.MEDIUM, locale);

       DateFormat dateTimeShortFormat = DateFormat.getDateTimeInstance(
        DateFormat.SHORT, DateFormat.SHORT, locale);

       // first day of the week index consistent with pgfcalendar
       // (0 = Monday, etc)
       int firstDay = 0;

       Calendar cal = Calendar.getInstance(locale);
       cal.setTimeInMillis(now.getTime());

       switch (cal.getFirstDayOfWeek())
       {
          case Calendar.MONDAY:
            firstDay = 0;
          break;
          case Calendar.TUESDAY:
            firstDay = 1;
          break;
          case Calendar.WEDNESDAY:
            firstDay = 2;
          break;
          case Calendar.THURSDAY:
            firstDay = 3;
          break;
          case Calendar.FRIDAY:
            firstDay = 4;
          break;
          case Calendar.SATURDAY:
            firstDay = 5;
          break;
          case Calendar.SUNDAY:
            firstDay = 6;
          break;
       }

       String dateGroup = String.format("{%s}{%s}{%s}{%s}{%d}",
             escapeText(dateFullFormat.format(now)),
             escapeText(dateLongFormat.format(now)),
             escapeText(dateMediumFormat.format(now)),
             escapeText(dateShortFormat.format(now)),
             firstDay);

       String dateFmtGroup = String.format("{%s}{%s}{%s}{%s}",
         formatDateTimePattern(dateFullFormat),
         formatDateTimePattern(dateLongFormat),
         formatDateTimePattern(dateMediumFormat),
         formatDateTimePattern(dateShortFormat));

       String timeGroup = String.format("{%s}{%s}{%s}{%s}",
             escapeText(timeFullFormat.format(now)),
             escapeText(timeLongFormat.format(now)),
             escapeText(timeMediumFormat.format(now)),
             escapeText(timeShortFormat.format(now)));

       String timeFmtGroup = String.format("{%s}{%s}{%s}{%s}",
         formatDateTimePattern(timeFullFormat),
         formatDateTimePattern(timeLongFormat),
         formatDateTimePattern(timeMediumFormat),
         formatDateTimePattern(timeShortFormat));

       String dateTimeGroup = String.format("{%s}{%s}{%s}{%s}",
             escapeText(dateTimeFullFormat.format(now)),
             escapeText(dateTimeLongFormat.format(now)),
             escapeText(dateTimeMediumFormat.format(now)),
             escapeText(dateTimeShortFormat.format(now)));

       String dateTimeFmtGroup = String.format("{%s}{%s}{%s}{%s}",
         formatDateTimePattern(dateTimeFullFormat),
         formatDateTimePattern(dateTimeLongFormat),
         formatDateTimePattern(dateTimeMediumFormat),
         formatDateTimePattern(dateTimeShortFormat));

       DateFormatSymbols dateFmtSyms = DateFormatSymbols.getInstance(locale);

       String[] names = dateFmtSyms.getWeekdays();

       // Be consistent with pgfcalendar:

       String weekdayNamesGroup = String.format(
          "{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
           escapeText(names[Calendar.MONDAY]),
           escapeText(names[Calendar.TUESDAY]),
           escapeText(names[Calendar.WEDNESDAY]),
           escapeText(names[Calendar.THURSDAY]),
           escapeText(names[Calendar.FRIDAY]),
           escapeText(names[Calendar.SATURDAY]),
           escapeText(names[Calendar.SUNDAY]));

       names = dateFmtSyms.getShortWeekdays();

       String shortWeekdayNamesGroup = String.format(
          "{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
           escapeText(names[Calendar.MONDAY]),
           escapeText(names[Calendar.TUESDAY]),
           escapeText(names[Calendar.WEDNESDAY]),
           escapeText(names[Calendar.THURSDAY]),
           escapeText(names[Calendar.FRIDAY]),
           escapeText(names[Calendar.SATURDAY]),
           escapeText(names[Calendar.SUNDAY]));

       StringBuilder monthNamesGroup = new StringBuilder();

       names = dateFmtSyms.getMonths();

       for (int i = 0; i < 12; i++)
       {
          // skip 13th month (Calendar.UNDECIMBER)
          monthNamesGroup.append(String.format("{%s}", escapeText(names[i])));
       }

       StringBuilder shortMonthNamesGroup = new StringBuilder();

       names = dateFmtSyms.getShortMonths();

       for (int i = 0; i < 12; i++)
       {
          shortMonthNamesGroup.append(String.format("{%s}", 
            escapeText(names[i])));
       }

       // Get numerical data (as with getNumericalInfo)
       DecimalFormatSymbols fmtSyms 
               = DecimalFormatSymbols.getInstance(locale);

       // ISO 4217 code
       String currencyCode = fmtSyms.getInternationalCurrencySymbol();

       // Currency symbol
       String currency = fmtSyms.getCurrencySymbol();

       // Check for known unofficial currency codes

       String localeCurrencyCode = currencyCode;

       String countryCode = locale.getCountry();

       if (countryCode != null && !"".equals(countryCode))
       {
          if (countryCode.equals("GG") || countryCode.equals("GGY")
           || countryCode.equals("831"))
          {// Guernsey
             localeCurrencyCode = "GGP";
             currency = POUND_STRING;
          }
          else if (countryCode.equals("JE") || countryCode.equals("JEY")
           || countryCode.equals("832"))
          {// Jersey
             localeCurrencyCode = "JEP";
             currency = POUND_STRING;
          }
          else if (countryCode.equals("IM") || countryCode.equals("IMN")
           || countryCode.equals("833"))
          {// Isle of Man
             localeCurrencyCode = "IMP";
             currency = String.format("M%s", POUND_STRING);
          }
          else if (countryCode.equals("KI") || countryCode.equals("KIR")
           || countryCode.equals("296"))
          {// Kiribati
             localeCurrencyCode = "KID";
             currency = "$";
          }
          else if (countryCode.equals("TV") || countryCode.equals("TUV")
           || countryCode.equals("798"))
          {// Tuvaluan
             localeCurrencyCode = "TVD";
             currency = "$";
          }
          // Transnistrian ruble omitted as it conflicts with ISO
          // 4217. There's also no country code for
          // Transnistria. Other currencies don't have an associated
          // region code (for example, Somaliland) or don't have a
          // known unofficial currency code (for example, Alderney).
       }

       // Convert known Unicode currency symbols to commands that
       // may be redefined in TeX

       String texCurrency = getTeXCurrency(currency);

       NumberFormat numFormat = NumberFormat.getNumberInstance(locale);
       NumberFormat intFormat = NumberFormat.getIntegerInstance(locale);
       NumberFormat curFormat = NumberFormat.getCurrencyInstance(locale);
       NumberFormat pcFormat = NumberFormat.getPercentInstance(locale);

       String numGroup = String.format(
         "{%s}{%s}{%s}{%d}{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
             escapeText(fmtSyms.getGroupingSeparator()),
             escapeText(fmtSyms.getDecimalSeparator()),
             escapeText(fmtSyms.getExponentSeparator()), 
             numFormat.isGroupingUsed() ? 1 : 0,
             currencyCode,
             localeCurrencyCode,
             escapeText(currency),
             texCurrency,// already escaped
             escapeText(fmtSyms.getMonetaryDecimalSeparator()),
             escapeText(fmtSyms.getPercent()),
             escapeText(fmtSyms.getPerMill()));

       String numFmtGroup = String.format("{%s}{%s}{%s}{%s}",
         formatNumberPattern(numFormat),
         formatNumberPattern(intFormat),
         formatNumberPattern(curFormat),
         formatNumberPattern(pcFormat));

       return String.format(
          "{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}{%s}",
             langRegionGroup,
             dateGroup,
             dateFmtGroup,
             timeGroup,
             timeFmtGroup,
             dateTimeGroup,
             dateTimeFmtGroup,
             weekdayNamesGroup,
             shortWeekdayNamesGroup,
             monthNamesGroup,
             shortMonthNamesGroup,
             getStandaloneWeekdays(cal, locale),
             getStandaloneShortWeekdays(cal, locale),
             getStandaloneMonths(cal, locale),
             getStandaloneShortMonths(cal, locale),
             numGroup, numFmtGroup);
   }

    /**
     * Prints the syntax usage.
     */
   protected void syntax()
   {
      System.out.println(String.format("Usage: %s [<options>] <actions>", name));

      System.out.println();
      System.out.println("Cross-platform OS query application");
      System.out.println("for use with TeX's shell escape.");
      System.out.println();
      System.out.println("Each query displays the result in a single line.");
      System.out.println("An empty string is printed if the requested");
      System.out.println("information is unavailable or not permitted.");
      System.out.println("Multiple actions group the results.");
      System.out.println();
      System.out.println("See the manual (texdoc texosquery) for further details.");

      System.out.println();
      System.out.println("Options:");
      System.out.println();

      System.out.println("-h or --help or -help");
      System.out.println("\tDisplay this help message and exit.");
      System.out.println();

      System.out.println("-v or --version or -version");
      System.out.println("\tDisplay version information and exit.");
      System.out.println();

      System.out.println("--nodebug");
      System.out.println("\tNo debugging messages (default)");
      System.out.println();

      System.out.println("--debug [<n>] or -debug [<n>]");
      System.out.println("\tDisplay debugging messages on STDOUT.");
      System.out.println("\t<n> should be an integer:");
      System.out.println("\t0: no debugging (same as --nodebug)");
      System.out.println("\t1: basic debugging messages");
      System.out.println("\t2: additionally display stack trace.");
      System.out.println(String.format("\tIf omitted %d is assumed", DEFAULT_DEBUG_LEVEL));
      System.out.println();

      System.out.println("--compatible <n> or -compat <n>");
      System.out.println("\tCompatibility setting.");
      System.out.println("\t<n> should be \"latest\" (default) or an integer:");

      for (int i = 0; i < DEFAULT_COMPATIBLE; i++)
      {
         System.out.println(String.format("\t%d: version 1.%d", i, i));
      }

      System.out.println();

      System.out.println("--encoding <charset> or -enc <charset>");
      System.out.println("\tSet the file encoding to <charset>.");

      System.out.println();

      System.out.println("--default-encoding or -defenc");
      System.out.println("\tUse the default file encoding.");

      System.out.println();

      System.out.println("--strip-path-prefix <prefix> or -sp <prefix>");
      System.out.println("\tStrip the given prefix from returned path names.");
      System.out.println("\tCan't be used with --replace-path.");
      System.out.println();

      System.out.println("--nostrip-path-prefix");
      System.out.println("\tCancel the effect of --strip-path-prefix.");
      System.out.println();

      System.out.println("--replace-path <regex> <replacement> or -rp <regex> <replacement>");
      System.out.println("\tSubstitutes the first occurrence of <regex> with");
      System.out.println("\t<replacement> in any returned path names.");
      System.out.println("\tCan't be used with --strip-path-prefix.");
      System.out.println();

      System.out.println("--noreplace-path");
      System.out.println("\tCancel the effect of --replace-path.");
      System.out.println();

      System.out.println("--strip-uri-prefix <prefix> or -su <prefix>");
      System.out.println("\tReplace 'file:/<prefix>' with 'file:/'");
      System.out.println("\tfrom returned URIs.");
      System.out.println("\tCan't be used with --replace-uri.");
      System.out.println();

      System.out.println("--nostrip-uri-prefix");
      System.out.println("\tCancel the effect of --strip-uri-prefix.");
      System.out.println();

      System.out.println("--replace-uri <regex> <replacement> or -ru <regex> <replacement>");
      System.out.println("\tSubstitutes the first occurrence of <regex> with");
      System.out.println("\t<replacement> in any returned URIs.");
      System.out.println("\tCan't be used with --strip-uri-prefix.");
      System.out.println();

      System.out.println("--noreplace-uri");
      System.out.println("\tCancel the effect of --replace-uri.");
      System.out.println();

      System.out.println();
      System.out.println("General actions:");
      System.out.println();

      for (QueryAction action : AVAILABLE_ACTIONS)
      {
         if (action.getType() == QueryActionType.GENERAL_ACTION)
         {
            System.out.println(action.help());
         }
      }

      System.out.println();
      System.out.println("Locale actions:");
      System.out.println();

      for (QueryAction action : AVAILABLE_ACTIONS)
      {
         if (action.getType() == QueryActionType.LOCALE_ACTION)
         {
            System.out.println(action.help());
         }
      }

      System.out.println();
      System.out.println("File actions:");
      System.out.println();
      System.out.println("Paths should use / for the directory divider.");
      System.out.println("TeX's openin_any setting is checked before attempting");
      System.out.println("to access file information.");
      System.out.println();

      for (QueryAction action : AVAILABLE_ACTIONS)
      {
         if (action.getType() == QueryActionType.FILE_ACTION)
         {
            System.out.println(action.help());
         }
      }
   }

    /**
     * Prints the version.
     */
   protected void version()
   {
       System.out.println(String.format("%s %s %s", name, VERSION_NUMBER,
                VERSION_DATE));
       System.out.println("Copyright 2016 Nicola Talbot");
       System.out.println("License LPPL 1.3+ (http://ctan.org/license/lppl1.3)");
   }

    /**
     * Prints the information with optional grouping.
     * @param numActions Add grouping if number of actions &gt; 1
     * @param info Information to print
     * @since 1.2
     */ 
   protected void print(int numActions, String info)
   {
      if (compatible == 0)
      {
         // version 1.0 didn't use grouping
         System.out.println(info);
      }
      else
      {
         if (numActions > 1)
         {
            System.out.println(String.format("{%s}", info));
         }
         else
         {
            System.out.println(info);
         }
      }
   }

   /**
    * Find the action corresponding to the name (the command line
    * switch). Once the action has been found, a copy must be
    * returned since the same action may be used multiple times with
    * different arguments.
    * @param action The command line switch (either the short or long
    * form)
    * @return a copy of the predefined action or null if not found 
    * @since 1.2
    */ 
   private QueryAction getAction(String action)
   {
      for (int i = 0; i < AVAILABLE_ACTIONS.length; i++)
      {
         if (AVAILABLE_ACTIONS[i].isAction(action))
         {
            return AVAILABLE_ACTIONS[i].copy();
         }
      }

      return null;
   }

   public static int parseArgVal(String[] args, int i, Object[] argVal)
   {
      String[] sp;

      if (args[i].startsWith("--"))
      {
         sp = args[i].split("=", 2);
      }
      else
      {
         sp = new String[]{args[i]};
      }

      argVal[0] = sp[0];

      if (sp.length == 2)
      {
         argVal[1] = sp[1];
         return i;
      }

      if (i == args.length-1 || args[i+1].startsWith("-"))
      {
         argVal[1] = null;
         return i; 
      }

      argVal[1] = args[++i];

      return i;
   }

   public static int parseArgInt(String[] args, int i, Object[] argVal)
   {
      i = parseArgVal(args, i, argVal);

      if (argVal[1] != null)
      {
         try
         {
            argVal[1] = new Integer((String)argVal[1]);
         }
         catch (NumberFormatException e)
         {
            throw new IllegalArgumentException(String.format(
              "Invalid '%s' value: %s", argVal[0], argVal[1]), e);
         }
      }

      return i;
   }

   public static boolean isArg(String arg, String shortArg, String longArg)
   {
      return arg.equals("-"+shortArg) || arg.equals("--"+longArg) 
        || arg.startsWith("--"+longArg+"=");
   }


   public static boolean isArg(String arg, String longArg)
   {
      return arg.equals("--"+longArg) || arg.startsWith("--"+longArg+"=");
   }

    /**
     * Process command line arguments. Options must come before
     * actions. (The copied QueryAction objects retain the settings
     * from the time of their creation.)
     * @param args Command line arguments.
     * @since 1.2
     */
   public void processArgs(String[] args)
   {
      Vector<QueryAction> actions = new Vector<QueryAction>();
      Object[] argVal = new Object[2];

      for (int i = 0; i < args.length; i++)
      {
         QueryAction action = getAction(args[i]);

         if (action != null)
         {
            try
            {
               i = action.parseArgs(args, i)-1;
               actions.add(action);
            }
            catch (IllegalArgumentException e)
            {
               debug(e.getMessage(), e);
               throw e;
            }
            catch (Throwable e)
            {
               debug(e.getMessage(), e);
               throw new IllegalArgumentException(e.getMessage(), e);
            }
         }
         else if (args[i].equals("-h") || args[i].equals("--help")
            || args[i].equals("-help"))
         {
            syntax();
            System.exit(0);
         }
         else if (args[i].equals("-v") || args[i].equals("--version") 
           || args[i].equals("-version"))
         {
            version();
            System.exit(0);
         }
         else if (args[i].equals("--nodebug"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            debugLevel = 0;
         }
         else if (isArg(args[i], "debug", "debug"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            i = parseArgInt(args, i, argVal);

            if (argVal[1] == null)
            {
               debugLevel = DEFAULT_DEBUG_LEVEL;
            }
            else
            {
               debugLevel = ((Integer)argVal[1]).intValue();

               if (debugLevel < 0)
               {
                  throw new IllegalArgumentException(String.format(
                    "Invalid debug level: %s", args[i]));
               }
            }
         }
         else if (isArg(args[i], "compat", "compatible"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            if (argVal[1] == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<level> expected after: %s", args[i]));
            }

            if (argVal[1].equals("latest"))
            {
               compatible = DEFAULT_COMPATIBLE;
            }
            else
            {
               try
               {
                  compatible = Integer.parseInt((String)argVal[1]);
               }
               catch (NumberFormatException e)
               {
                  throw new IllegalArgumentException(String.format(
                   "Invalid %s argument (\"latest\" or %d to %d required): %s",
                   argVal[0], 0, DEFAULT_COMPATIBLE, argVal[1]), e);
               }
            }
         }
         else if (isArg(args[i], "sp", "strip-path-prefix"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            if (pathRegExp != null)
            {
               throw new IllegalArgumentException(String.format(
                 "Option clash: %s and --replace-path", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            if (argVal[1] == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<prefix> expected after: %s", args[i]));
            }

            stripFilePrefix = (String)argVal[1];
         }
         else if (isArg(args[i], "nostrip-path-prefix"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            stripFilePrefix = null;
         }
         else if (isArg(args[i], "rp", "replace-path"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            if (stripFilePrefix != null)
            {
               throw new IllegalArgumentException(String.format(
                 "Option clash: --strip-path-prefix and %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            pathRegExp = (String)argVal[1];

            if (pathRegExp == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<regex> <replacement> expected after: %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            pathReplacement = (String)argVal[1];

            if (pathReplacement == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<replacement> expected after: %s %s", args[i], pathRegExp));
            }

         }
         else if (isArg(args[i], "noreplace-path"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            pathRegExp = null;
            pathReplacement = null;
         }
         else if (isArg(args[i], "su", "strip-uri-prefix"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            if (uriRegExp != null)
            {
               throw new IllegalArgumentException(String.format(
                 "Option clash: %s and --replace-uri", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            if (argVal[1] == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<prefix> expected after: %s", args[i]));
            }

            stripURIPrefix = (String)argVal[1];
         }
         else if (isArg(args[i], "nostrip-uri-prefix"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            stripURIPrefix = null;
         }
         else if (isArg(args[i], "ru", "replace-uri"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            if (stripURIPrefix != null)
            {
               throw new IllegalArgumentException(String.format(
                 "Option clash: --strip-uri-prefix and %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            uriRegExp = (String)argVal[1];

            if (uriRegExp == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<regex> <replacement> expected after: %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            uriReplacement = (String)argVal[1];

            if (uriReplacement == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<replacement> expected after: %s %s", args[i], uriRegExp));
            }

         }
         else if (isArg(args[i], "noreplace-uri"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            uriRegExp = null;
            uriReplacement = null;
         }
         else if (isArg(args[i], "enc", "encoding"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            i = parseArgVal(args, i, argVal);

            if (argVal[1] == null)
            {
               throw new IllegalArgumentException(String.format(
                 "<charset> expected after: %s", args[i]));
            }

            fileEncoding = (String)argVal[1];
         }
         else if (isArg(args[i], "defenc", "default-encoding"))
         {
            if (actions.size() > 0)
            {
               throw new IllegalArgumentException(String.format(
                "Options must come before actions. Found option: %s", args[i]));
            }

            fileEncoding = null;
         }
         else
         {
             throw new IllegalArgumentException(String.format(
               "Unknown option: %s%nTry %s --help", args[i], name));
         }
      }

      int numActions = actions.size();

      if (numActions == 0)
      {
         throw new IllegalArgumentException(String.format(
           "One or more actions required.%nTry %s --help", name));
      }

      if (fileEncoding != null)
      {
         // new to v1.6
         try
         {
            // Change the encoding of STDOUT.
            // This is done by setting STDOUT to the original system
            // STDOUT (FileDescription.out) within a print stream that 
            // has the appropriate file encoding.

            // (This is more useful that setting file.encoding when
            // the Java virtual machine starts up as this can be done on
            // a per-document basis. Otherwise it requires editing
            // the script that invokes the JVM.)

            PrintStream stream = new PrintStream(
                new FileOutputStream(FileDescriptor.out),
                true, // auto flush
                fileEncoding);

            System.setOut(stream);
         }
         catch (UnsupportedEncodingException e)
         {
            throw new IllegalArgumentException("VM does not support encoding "
             +fileEncoding, e);
         }
      }

      for (QueryAction action : actions)
      {
         try
         {
            print(numActions, action.doAction(compatible));
         }
         catch (Throwable e)
         {
            // Any errors should've been picked up by the action, 
            // so this is most likely a runtime error that needs
            // to be reported.

            System.err.println("Fatal error: "+e.getMessage());

            if (debugLevel < DEBUG_STACK_TRACE_LEVEL)
            {
               System.err.println(String.format(
                 "Use --debug %d to obtain stack trace", 
                 DEBUG_STACK_TRACE_LEVEL));
            }

            debug(String.format("Action failed: %s", action.getInvocation()),
              e);
            System.exit(1);
         }
      }
   }

   private final QueryAction[] AVAILABLE_ACTIONS = new QueryAction[]
   {
      new QueryAction("cwd", "c", QueryActionType.FILE_ACTION, 
        "Display current working directory")
      {
         public String action()
         {
            return getCwd();
         }
      },
      new QueryAction("userhome", "m", QueryActionType.FILE_ACTION,
         "Display user's home directory")
      {
         public String action()
         {
            return getUserHome();
         }
      },
      new QueryAction("tmpdir", "t", QueryActionType.FILE_ACTION,
         "Display temporary directory")
      {
         public String action()
         {
            return getTmpDir();
         }
      },
      new QueryAction("osname", "o", QueryActionType.GENERAL_ACTION,
        "Display OS name")
      {
         public String action()
         {
            return getOSname();
         }
      },
      new QueryAction("osversion", "r", QueryActionType.GENERAL_ACTION, 
        "Display OS version")
      {
         public String action()
         {
            return getOSversion();
         }
      },
      new QueryAction("osarch", "a", QueryActionType.GENERAL_ACTION, 
        "Display OS architecture")
      {
         public String action()
         {
            return getOSarch();
         }
      },
      new QueryAction("pdfnow", "n", QueryActionType.GENERAL_ACTION, 
        "Display current date-time in PDF format")
      {
         public String action()
         {
            return pdfnow();
         }
      },
      new QueryAction("locale", "L", QueryActionType.LOCALE_ACTION,
         "Display POSIX locale information")
      {
         public String action()
         {
            return getLocale(Locale.getDefault());
         }
      },
      new QueryAction("locale-lcs", "l", QueryActionType.LOCALE_ACTION,
         "Display POSIX style locale information with lower case codeset")
      {
         public String action()
         {
            return getLocale(Locale.getDefault(), true);
         }
      },
      new QueryAction("codeset", "cs", QueryActionType.GENERAL_ACTION, 
         "Display the codeset", 2)
      {// new to v1.6
         public String action()
         {
            return escapeFileName(getCodeSet(false));
         }
      },
      new QueryAction("codeset-lcs", "C", QueryActionType.GENERAL_ACTION, 
         "Lower case codeset with hyphens stripped", 2)
      {
         public String action()
         {
            return escapeFileName(getCodeSet(true));
         }
      },
      new QueryAction("bcp47", "b", QueryActionType.LOCALE_ACTION,
         "Display locale as BCP47 tag", 2)
      {
         public String action()
         {
            return escapeFileName(getLanguageTag(null));
         }
      },
      new QueryAction("numeric", "N", 1, 0, "[locale]",
          QueryActionType.LOCALE_ACTION,
          "Display locale numeric information", 2)
      {
         public String action()
         {
            return getNumericalInfo(getOptionalArgument(0));
         }
      },
      new QueryAction("locale-data", "D", 1, 0, "[locale]",
         QueryActionType.LOCALE_ACTION,
         "Display all available locale information", 2)
      {
         public String action()
         {
            return getLocaleData(getOptionalArgument(0));
         }
      },
      new QueryAction("date-time", "M", 
         QueryActionType.GENERAL_ACTION,
         "Display all the current date-time data", 2)
      {
         public String action()
         {
            return getDateTimeData();
         }
      },
      new QueryAction("time-zones", "Z", 1, 0, "[locale]",
         QueryActionType.LOCALE_ACTION,
         "Display all available time zone information", 2)
      {
         public String action()
         {
            return getTimeZones(getOptionalArgument(0));
         }
      },
      new QueryAction("pdfdate", "d", 0, 1, "<file>",
         QueryActionType.FILE_ACTION, 
         "Display date stamp of <file> in PDF format")
      {
         public String action()
         {
            return pdfDate(fileFromTeXPath(getRequiredArgument(0)));
         }
      },
      new QueryAction("filesize", "s", 0, 1, "<file>",
         QueryActionType.FILE_ACTION,
         "Display size of <file> in bytes")
      {
         public String action()
         {
            return getFileLength(fileFromTeXPath(getRequiredArgument(0)));
         }
      },
      new QueryAction("list", "i", 1, 2, "<sep> <dir> [<sort>]",
         QueryActionType.FILE_ACTION,
         String.format("Display list of all files in <dir> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s",
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFileList(getRequiredArgument(0),
              new File(fromTeXPath(getRequiredArgument(1))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_ANY);
         }
      },
      new QueryAction("filterlist", "f", 1, 3, "<sep> <regex> <dir> [<sort>]",
         QueryActionType.FILE_ACTION, 
         String.format("Display list of files in <dir> that fully match <regex> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s", 
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFilterFileList(
                  getRequiredArgument(0), 
                  getRequiredArgument(1), 
                  new File(fromTeXPath(getRequiredArgument(2))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_ANY);
         }
      },
      new QueryAction("list-dir", "id", 1, 2, "<sep> <dir> [<sort>]",
         QueryActionType.FILE_ACTION,
         String.format("Display list of all sub-directories in <dir> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s",
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFileList(getRequiredArgument(0),
              new File(fromTeXPath(getRequiredArgument(1))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_DIRECTORIES_ONLY);
         }
      },
      new QueryAction("filterlist-dir", "fd", 1, 3, "<sep> <regex> <dir> [<sort>]",
         QueryActionType.FILE_ACTION, 
         String.format("Display list of sub-directories in <dir> that fully match <regex> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s", 
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFilterFileList(
                  getRequiredArgument(0), 
                  getRequiredArgument(1), 
                  new File(fromTeXPath(getRequiredArgument(2))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_DIRECTORIES_ONLY);
         }
      },
      new QueryAction("list-regular", "ir", 1, 2, "<sep> <dir> [<sort>]",
         QueryActionType.FILE_ACTION,
         String.format("Display list of all regular files in <dir> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s",
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFileList(getRequiredArgument(0),
              new File(fromTeXPath(getRequiredArgument(1))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_REGULAR_FILES_ONLY);
         }
      },
      new QueryAction("filterlist-regular", "fr", 1, 3, "<sep> <regex> <dir> [<sort>]",
         QueryActionType.FILE_ACTION, 
         String.format("Display list of regular files in <dir> that fully match <regex> separated by <sep>. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s", 
           FileSortType.getFileSortOptions()))
      {
         public String action()
         {
            return getFilterFileList(
                  getRequiredArgument(0), 
                  getRequiredArgument(1), 
                  new File(fromTeXPath(getRequiredArgument(2))),
                  FileSortType.getFileSortType(getOptionalArgument(0)),
                  FileListType.FILE_LIST_REGULAR_FILES_ONLY);
         }
      },
      new QueryAction("walk", "w", 1, 3, "<sep> <regex> <dir> [<sort>]",
         QueryActionType.FILE_ACTION, 
          String.format("Display list of regular non-hidden files in <dir> (descending sub-directories) that fully match <regex> separated by <sep>. The starting directory <dir> may not be outside the current working directory. This action is not available for texosquery-jre5. If <sort> is omitted, the default order is used otherwise <sort> may be one of the following: %s", 
           FileSortType.getFileSortOptions()), 2)
      {
         public String action()
         {
            return walk(
                  getRequiredArgument(0), 
                  getRequiredArgument(1), 
                  new File(fromTeXPath(getRequiredArgument(2))),
                  FileSortType.getFileSortType(getOptionalArgument(0)));
         }
      },
      new QueryAction("uri", "u", 0, 1, "<file>",
         QueryActionType.FILE_ACTION, "Display the URI of <file>")
      {
         public String action()
         {
            return fileURI(fileFromTeXPath(getRequiredArgument(0)));
         }
      },
      new QueryAction("path", "p", 0, 1, "<file>",
         QueryActionType.FILE_ACTION, "Display the canonical path of <file>")
      {
         public String action()
         {
            return filePath(fileFromTeXPath(getRequiredArgument(0)));
         }
      },
      new QueryAction("dirname", "e", 0, 1, "<file>",
         QueryActionType.FILE_ACTION,
         "Display the canonical path of the parent of <file>")
      {
         public String action()
         {
            return parentPath(fileFromTeXPath(getRequiredArgument(0)));
         }
      }
   };

   /**
    * Application name.
    */ 
   private String name;
    
   public static final int DEFAULT_COMPATIBLE=2;

   private static final String VERSION_NUMBER = "1.6";
   private static final String VERSION_DATE = "2017-06-20";
   private static final char BACKSLASH = '\\';
   private static final long ZERO = 0L;

   /**
    * Initialise current date-time for consistency.
    */ 

   private Date now = new Date();

   /**
    * openin_any settings
    */
   protected static final char OPENIN_UNSET=0; // unset
   protected static final char OPENIN_A='a'; // any
   protected static final char OPENIN_R='r'; // restricted
   protected static final char OPENIN_P='p'; // paranoid

   private char openin = OPENIN_UNSET;

   private File texmfoutput = null;

   /**
    * If not null, strip from the start of returned path names.
    * @since 1.5
    */ 
   private String stripFilePrefix = null;

   /**
    *Instead of using the above, provide a regular expression and replacement. 
    * @since 1.5
    */ 
   private String pathRegExp=null, pathReplacement=null;

   /**
    * If not null, strip from the start of returned URI path names
    * (after file:/).
    * @since 1.5
    */ 
   private String stripURIPrefix = null;

   /**
    *Instead of using the above, provide a regular expression and replacement. 
    * @since 1.5
    */ 
   private String uriRegExp=null, uriReplacement=null;

   /**
    *Charset for stdout (allows user to override default) 
    * @since 1.6
    */ 
   private String fileEncoding=null;

   /**
    * Debug level. (0 = no debugging, 1 or more print error messages to
    * STDERR, 2 or more include stack trace, 3 or more include
    * informational messages.)
    */
   private int debugLevel = 0;

   public static final int DEFAULT_DEBUG_LEVEL=3;
   public static final int DEBUG_ERROR_LEVEL=1;
   public static final int DEBUG_STACK_TRACE_LEVEL=2;
   public static final int DEBUG_INFO_LEVEL=3;

   /**
    * Compatibility mode. Version 1.2 replaces escapeHash with
    * escapeSpChars, which switches to using \\fhsh etc. Provide a
    * mode to restore the previous behaviour.
    */ 
   private int compatible = DEFAULT_COMPATIBLE;

   // TeX can only go up to 2147483647, so set the maximum number
   // of digits provided for the number formatter. 

   private static final int MAX_DIGIT_FORMAT=10;

   // Dollar symbol
   private static final char DOLLAR_CHAR=0x0024;

   // Cent symbol
   private static final char CENT_CHAR=0x00A2;

   // Pound symbol
   private static final char POUND_CHAR=0x00A3;

   // Pound symbol as a string
   private static final String POUND_STRING=""+POUND_CHAR;

   // Currency symbol
   private static final char CURRENCY_CHAR=0x00A4;

   // Yen symbol
   private static final char YEN_CHAR=0x00A5;

   // ECU symbol
   private static final char ECU_CHAR=0x20A0;

   // Colon currency symbol
   private static final char COLON_CURRENCY_CHAR=0x20A1;

   // Cruzeiro symbol
   private static final char CRUZEIRO_CHAR=0x20A2;

   // Franc symbol
   private static final char FRANC_CHAR=0x20A3;

   // Lira symbol
   private static final char LIRA_CHAR=0x20A4;

   // Mill currency symbol
   private static final char MILL_CURRENCY_CHAR=0x20A5;

   // Naira symbol
   private static final char NAIRA_CHAR=0x20A6;

   // Peseta symbol
   private static final char PESETA_CHAR=0x20A7;

   // Legacy rupee symbol
   private static final char LEGACY_RUPEE_CHAR=0x20A8;

   // Won symbol
   private static final char WON_CHAR=0x20A9;

   // New sheqel symbol
   private static final char NEW_SHEQEL_CHAR=0x20AA;

   // Dong symbol
   private static final char DONG_CHAR=0x20AB;

   // Euro symbol
   private static final char EURO_CHAR=0x20AC;

   // Kip symbol
   private static final char KIP_CHAR=0x20AD;

   // Tugrik symbol
   private static final char TUGRIK_CHAR=0x20AE;

   // Drachma symbol
   private static final char DRACHMA_CHAR=0x20AF;

   // German penny symbol
   private static final char GERMAN_PENNY_CHAR=0x20B0;

   // Peso symbol
   private static final char PESO_CHAR=0x20B1;

   // Guarani symbol
   private static final char GUARANI_CHAR=0x20B2;

   // Austral symbol
   private static final char AUSTRAL_CHAR=0x20B3;

   // Hryvnia symbol
   private static final char HRYVNIA_CHAR=0x20B4;

   // Cedi symbol
   private static final char CEDI_CHAR=0x20B5;

   // Livre tournois symbol
   private static final char LIVRE_TOURNOIS_CHAR=0x20B6;

   // Spesmilo symbol
   private static final char SPESMILO_CHAR=0x20B7;

   // Tenge symbol
   private static final char TENGE_CHAR=0x20B8;

   // Official rupee symbol
   private static final char RUPEE_CHAR=0x20B9;

   // Turkish lira symbol
   private static final char TURKISH_LIRA_CHAR=0x20BA;

   // Nordic mark symbol
   private static final char NORDIC_MARK_CHAR=0x20BB;

   // Manat symbol
   private static final char MANAT_CHAR=0x20BC;

   // Ruble symbol
   private static final char RUBLE_CHAR=0x20BD;

   // Per mille symbol
   private static final char PERMILLE_CHAR=0x2030;
}
