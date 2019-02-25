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
import java.io.File;

/**
 * Used to compare two file names according to the given sort type.
 * @since 1.2
 */
public class FileSortComparator implements Comparator<String>
{
   /**
    * Creates a new comparator for ordering file listings.
    * @param baseDir the directory containing the listed files
    * @param sortType the way in which the files should be ordered
    */ 
   public FileSortComparator(File baseDir, FileSortType sortType)
   {
      this.baseDir = baseDir;
      this.sortType = sortType;
   }

   /**
    * Compares two files according to this object's sort type. 
    * @param name1 the name of the first file
    * @param name2 the name of the second file
    * @return -1 if name1 is considered less than name2, 0 if both are the same
    * or +1 if name2 is greater than name1, according to the sort
    * criteria
    */ 
   @Override
   public int compare(String name1, String name2)
   {
      int idx=-1;
      int result=0;
      long date1=0L;
      long date2=0L;
      long size1=0L;
      long size2=0L;
      String ext1="";
      String ext2="";
      File file1;
      File file2;

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

           idx = name1.lastIndexOf(".");

           ext1 = idx > -1 ? name1.substring(idx+1) : "";

           idx = name2.lastIndexOf(".");

           ext2 = idx > -1 ? name2.substring(idx+1) : "";

           result = ext1.compareTo(ext2);

           return result == 0 ? name1.compareTo(name2) : result;

         case FILE_SORT_EXT_DESCENDING:

           idx = name1.lastIndexOf(".");

           ext1 = idx > -1 ? name1.substring(idx+1) : "";

           idx = name2.lastIndexOf(".");

           ext2 = idx > -1 ? name2.substring(idx+1) : "";

           result =  ext2.compareTo(ext1);

           return result == 0 ? name2.compareTo(name1) : result;

         case FILE_SORT_DATE_ASCENDING:

           file1 = new File(baseDir, name1);
           file2 = new File(baseDir, name2);

           try
           {
              date1 = file1.lastModified();
              date2 = file2.lastModified();
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the last modified date can't be obtained.
           }

           return date1 == date2 ? 0 : (date1 < date2 ? -1 : 0);

         case FILE_SORT_DATE_DESCENDING:

           file1 = new File(baseDir, name1);
           file2 = new File(baseDir, name2);

           try
           {
              date1 = file1.lastModified();
              date2 = file2.lastModified();
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the last modified date can't be obtained.
           }

           return date1 == date2 ? 0 : (date1 > date2 ? -1 : 0);

         case FILE_SORT_SIZE_ASCENDING:

           file1 = new File(baseDir, name1);
           file2 = new File(baseDir, name2);

           try
           {
              size1 = file1.length();
              size2 = file2.length();
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the file size can't be obtained.
           }

           return size1 == size2 ? 0 : (size1 < size2 ? -1 : 0);

         case FILE_SORT_SIZE_DESCENDING:

           file1 = new File(baseDir, name1);
           file2 = new File(baseDir, name2);

           try
           {
              size1 = file1.length();
              size2 = file2.length();
           }
           catch (Exception e)
           {// file missing or no read access or for some other
            // reason the file size can't be obtained.
           }

           return size1 == size2 ? 0 : (size1 > size2 ? -1 : 0);
      }

      return 0;
   }


   private File baseDir;
   private FileSortType sortType;
}
