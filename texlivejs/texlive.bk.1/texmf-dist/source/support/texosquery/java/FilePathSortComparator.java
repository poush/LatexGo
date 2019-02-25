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

import java.util.Comparator;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.attribute.FileTime;

/**
 * Used to compare two paths according to the given sort type.
 * This uses the java.nio.file library, which was introduced in Java 7,
 * so this isn't available for the JRE5 version.
 * @since 1.2
 */
public class FilePathSortComparator implements Comparator<Path>
{
   /**
    * Creates a new comparator for ordering path listings.
    * @param sortType the way in which the files should be ordered
    */ 
   public FilePathSortComparator(FileSortType sortType)
   {
      this.sortType = sortType;
   }

   /**
    * Compares two paths according to this object's sort type. 
    * @param path1 the first path
    * @param path2 the second path
    * @return -1 if path1 is considered less than path2, 0 if both are the same
    * or +1 if path2 is greater than path1, according to the sort
    * criteria
    */ 
   @Override
   public int compare(Path path1, Path path2)
   {
      int idx=-1;
      int result=0;
      long date1=0L;
      long date2=0L;
      long size1=0L;
      long size2=0L;
      String ext1="";
      String ext2="";
      FileTime time1=null;
      FileTime time2=null;

      String name1 = path1.toString();
      String name2 = path2.toString();

      String basename1 = path1.getName(path1.getNameCount()-1).toString();
      String basename2 = path2.getName(path2.getNameCount()-1).toString();

      switch (sortType)
      {
         case FILE_SORT_NAME_ASCENDING:
           return name1.compareTo(name2);
         case FILE_SORT_NAME_DESCENDING:
           return name2.compareTo(name1);
         case FILE_SORT_NAME_NOCASE_ASCENDING:
           return name1.compareToIgnoreCase(name2);
         case FILE_SORT_NAME_NOCASE_DESCENDING:
           return name2.compareToIgnoreCase(name1);
         case FILE_SORT_EXT_ASCENDING:

           idx = basename1.lastIndexOf(".");

           ext1 = idx > -1 ? basename1.substring(idx+1) : "";

           idx = basename2.lastIndexOf(".");

           ext2 = idx > -1 ? basename2.substring(idx+1) : "";

           result = ext1.compareTo(ext2);

            // If the extensions are the same, compare paths instead

           return result == 0 ? name1.compareTo(name2) : result;

         case FILE_SORT_EXT_DESCENDING:

           idx = basename1.lastIndexOf(".");

           ext1 = idx > -1 ? basename1.substring(idx+1) : "";

           idx = basename2.lastIndexOf(".");

           ext2 = idx > -1 ? basename2.substring(idx+1) : "";

           result =  ext2.compareTo(ext1);

           return result == 0 ? name2.compareTo(name1) : result;

         case FILE_SORT_DATE_ASCENDING:

           try
           {
              time1 = Files.getLastModifiedTime(path1);
           }
           catch (Exception e)
           {
              // IO error or security manager has prohibited access
              return 1;
           }

           try
           {
              time2 = Files.getLastModifiedTime(path2);
           }
           catch (Exception e)
           {
              // IO error or security manager has prohibited access
              return -1;
           }

           return time1.compareTo(time2);

         case FILE_SORT_DATE_DESCENDING:

           try
           {
              time1 = Files.getLastModifiedTime(path1);
           }
           catch (Exception e)
           {
              // IO error or security manager has prohibited access
              return -1;
           }

           try
           {
              time2 = Files.getLastModifiedTime(path2);
           }
           catch (Exception e)
           {
              // IO error or security manager has prohibited access
              return 1;
           }

           return time2.compareTo(time1);

         case FILE_SORT_SIZE_ASCENDING:

           try
           {
              size1 = Files.size(path1);
              size2 = Files.size(path2);
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the file size can't be obtained.
           }

           return size1 == size2 ? 0 : (size1 < size2 ? -1 : 0);

         case FILE_SORT_SIZE_DESCENDING:

           try
           {
              size1 = Files.size(path1);
              size2 = Files.size(path2);
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the file size can't be obtained.
           }

           return size1 == size2 ? 0 : (size1 > size2 ? -1 : 0);
      }

      return 0;
   }

   private FileSortType sortType;
}
