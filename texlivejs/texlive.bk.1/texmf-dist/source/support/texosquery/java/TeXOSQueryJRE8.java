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

import java.util.Locale;
import java.util.Locale.Builder;
import java.util.Calendar;
import java.util.Map;
import java.util.Arrays;
import java.io.File;
import java.io.IOException;

/**
 * Main class. Supports Java 8 onwards.
 * @author Nicola Talbot
 * @version 1.2
 * @since 1.2
 */
public class TeXOSQueryJRE8 extends TeXOSQuery
{
   public TeXOSQueryJRE8()
   {
      super("texosquery-jre8");
   }

  /*
   * The fallback for openin_any is now the same for
   * all variants to allow texosquery-jre8 to work with MiKTeX
   * so openinFallbackValue method has been removed from this
   * subclass in v1.3.1.
   */ 

   /**
    * Converts the given directory to a canonical path
    * and checks to make sure it has a parent directory.
    * @param dir the directory to check
    * @return the canonical path
    * @throws IOException if directory can't be converted to a
    * canonical path or if the canonical path doesn't have a parent
    * directory or is outside the current working directory
    */ 
   @Override
   protected File checkDirectoryListing(File dir) throws IOException
   {
      dir = dir.getCanonicalFile();

      if (dir.getParentFile() == null)
      {
         throw new IOException(String.format(
           "Listing on root directory not permitted: %s", dir));
      }

      File cwd = new File(getSystemProperty("user.dir", "."));

      if (!cwd.equals(dir) && !isFileInTree(dir, cwd))
      {
         throw new IOException(String.format(
           "Listing outside cwd path not permitted: %s", dir));
      }

      return dir;
   }

   /**
    * Recursive file listing. This method must have the CWD or a
    * descendent as the starting directory. It will return list of
    * files relative to the starting directory where the basename
    * matches the supplied regular expression. Hidden files/directories 
    * and symbolic links are skipped regardless of the openin_any setting.
    * Files without read access are also omitted from the list.
    *
    * @param separator separator to use in returned list
    * @param regex regular expression used to match file basenames
    * @param directory starting directory (must be cwd or a
    * descendent of cwd)
    * @return list of relative paths
    */
   @Override
   public String walk(String separator,
            String regex, File directory, 
            FileSortType sortType)
   {
      try
      {
         return FileWalkVisitor.walk(this, separator,
           regex, directory, sortType);
      }
      catch (Exception e)
      {
         debug(String.format("Can't walk directory: %s",
           directory.toString()), e);
      }

      return "";
   }


    /**
     * Gets the script for the given locale.
     * @param locale The locale
     * @return The language script associated with the given locale or null if not available
     */
   @Override
   public String getScript(Locale locale)
   {
      return locale.getScript();
   }

   /**
    * Gets the locale from the given language tag.
    * @param languageTag The language tag
    * @return The locale that closest matches the language tag
    */
   @Override
   public Locale getLocale(String languageTag)
   {
      Locale locale = Locale.forLanguageTag(languageTag);

      // Locale.forLanguageTag() doesn't recognise
      // numeric regions. So test for a numeric region.

      String region = locale.getCountry();

      try
      {
         region = getRegionAlpha2Code(Integer.parseInt(region));
      }
      catch (NumberFormatException e)
      {
         // region isn't numeric, so we don't need to do anything
         // else
         return locale;
      }

      Locale.Builder builder = new Locale.Builder();
      builder.setLocale(locale);
      builder.setRegion(region);

      return builder.build();
   }

   /**
    * Gets the language tag for the given locale.
    * @param locale The locale or null for the default locale
    * @return The language tag
    */
   @Override
   public String getLanguageTag(Locale locale)
   {
      if (locale == null)
      {
         locale = Locale.getDefault();
      }

      return locale.toLanguageTag();
   }

   /**
    * Gets the week year for the given calendar.
    * @return The week year
    */
   @Override
   public int getWeekYear(Calendar cal)
   {
      try
      {
        return cal.isWeekDateSupported() ?
          cal.getWeekYear() : cal.get(Calendar.YEAR);
      }
      catch (UnsupportedOperationException e)
      {
         // shouldn't happen with the above conditional, but just in
         // case...

         debug(e.getMessage(), e);
         return cal.get(Calendar.YEAR);
      }
   }

   /** Gets the standalone month names for the locale data.
    * These are only available for Java 8, so just return the 
    * month names used in the date format instead.
    * @param cal The calendar
    * @param locale The locale
    * @return month names
    */
   public String getStandaloneMonths(Calendar cal, Locale locale)
   {
      Map<String,Integer> map = cal.getDisplayNames(Calendar.MONTH,
        Calendar.LONG_STANDALONE, locale);

      // Is the map order? Not sure so save in an array

      String[] names = new String[12];

      for (Map.Entry<String,Integer> entry : map.entrySet())
      {
         int idx = entry.getValue().intValue();

         if (idx < 12)
         {// Java has a 13th month that we're ignoring
            names[idx] = entry.getKey();
         }
      }

      StringBuilder builder = new StringBuilder();

      for (int i = 0; i < names.length; i++)
      {
         builder.append(String.format("{%s}", escapeText(names[i])));
      }

      return builder.toString();
   }

   /** Gets the standalone short month names for the locale data.
    * @param cal The calendar
    * @param locale The locale
    * @return month names
    */
   public String getStandaloneShortMonths(Calendar cal, Locale locale)
   {
      Map<String,Integer> map = cal.getDisplayNames(Calendar.MONTH,
        Calendar.SHORT_STANDALONE, locale);

      // Is the map order? Not sure so save in an array

      String[] names = new String[12];

      for (Map.Entry<String,Integer> entry : map.entrySet())
      {
         int idx = entry.getValue().intValue();

         if (idx < names.length)
         {
            names[idx] = entry.getKey();
         }
      }

      StringBuilder builder = new StringBuilder();

      for (int i = 0; i < names.length; i++)
      {
         builder.append(String.format("{%s}", escapeText(names[i])));
      }

      return builder.toString();
   }


   /** Gets the standalone week day names for the locale data.
    * @param cal The calendar
    * @param locale The locale
    * @return week day names
    */
   public String getStandaloneWeekdays(Calendar cal, Locale locale)
   {
      Map<String,Integer> map = cal.getDisplayNames(Calendar.DAY_OF_WEEK,
        Calendar.LONG_STANDALONE, locale);

      String[] names = new String[7];

      for (Map.Entry<String,Integer> entry : map.entrySet())
      {
         switch (entry.getValue().intValue())
         {
            case Calendar.MONDAY:
              names[0] = entry.getKey();
            break;
            case Calendar.TUESDAY:
              names[1] = entry.getKey();
            break;
            case Calendar.WEDNESDAY:
              names[2] = entry.getKey();
            break;
            case Calendar.THURSDAY:
              names[3] = entry.getKey();
            break;
            case Calendar.FRIDAY:
              names[4] = entry.getKey();
            break;
            case Calendar.SATURDAY:
              names[5] = entry.getKey();
            break;
            case Calendar.SUNDAY:
              names[6] = entry.getKey();
            break;
         }
      }

      StringBuilder builder = new StringBuilder();

      for (int i = 0; i < names.length; i++)
      {
         builder.append(String.format("{%s}", escapeText(names[i])));
      }

      return builder.toString();
   }

   /** Gets the standalone short week day names for the locale data.
    * @param cal The calendar
    * @param locale The locale
    * @return week day names
    */
   public String getStandaloneShortWeekdays(Calendar cal, Locale locale)
   {
      Map<String,Integer> map = cal.getDisplayNames(Calendar.DAY_OF_WEEK,
        Calendar.SHORT_STANDALONE, locale);

      String[] names = new String[7];

      for (Map.Entry<String,Integer> entry : map.entrySet())
      {
         switch (entry.getValue().intValue())
         {
            case Calendar.MONDAY:
              names[0] = entry.getKey();
            break;
            case Calendar.TUESDAY:
              names[1] = entry.getKey();
            break;
            case Calendar.WEDNESDAY:
              names[2] = entry.getKey();
            break;
            case Calendar.THURSDAY:
              names[3] = entry.getKey();
            break;
            case Calendar.FRIDAY:
              names[4] = entry.getKey();
            break;
            case Calendar.SATURDAY:
              names[5] = entry.getKey();
            break;
            case Calendar.SUNDAY:
              names[6] = entry.getKey();
            break;
         }
      }

      StringBuilder builder = new StringBuilder();

      for (int i = 0; i < names.length; i++)
      {
         builder.append(String.format("{%s}", escapeText(names[i])));
      }

      return builder.toString();
   }

   @Override
   public void sortFileList(String[] list, File directory, 
      FileSortType sortType)
   {
      Arrays.parallelSort(list, new FileSortComparator(directory, sortType));
   }

   /**
    * Main method.
    * @param args Command line arguments.
    */
   public static void main(String[] args)
   {
      try
      {
         (new TeXOSQueryJRE8()).processArgs(args);
      }
      catch (IllegalArgumentException e)
      {
         System.err.println(e.getMessage());
         System.exit(1);
      }
   }
}
