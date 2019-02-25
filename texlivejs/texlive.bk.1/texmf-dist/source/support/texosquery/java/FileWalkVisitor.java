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

import java.io.File;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.FileVisitResult;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Vector;
import java.util.Comparator;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * This class is used during a file walk to determine if a directory
 * may be descended and to add allowed files to the list.
 * This relies on the java.nio.file library, which was introduced to
 * Java 7, so this isn't available for the JRE5 version.
 * @since 1.2
 */
public class FileWalkVisitor extends SimpleFileVisitor<Path>
{
   /**
    * Creates a new visitor for a file walk. This will only allow
    * regular, non-hidden, readable files, where the name matches
    * the supplied regular expression. The found files are inserted
    * into the results list according to the comparator.
    */ 
   public FileWalkVisitor(TeXOSQuery invoker, String regex, 
     Comparator<Path> comparator)
   {
      this.invoker = invoker;
      this.comparator = comparator;
      pattern = Pattern.compile(regex);
      result = new Vector<Path>();
   }

   /**
    * Returns the list built during the file walk. 
    * @return file list
    */ 
   public Vector<Path> getList()
   {
      return result;
   }

   /**
    * Invoked for a directory before entries in the directory are
    * visited. 
    *
    * Hidden directories are automatically skipped, even if
    * openin_any is <tt>a</tt>. Symbolic links and directories without 
    * read access are also skipped.
    *
    * @param dir the directory about to be visited
    * @param attrs the directory's basic attributes
    * @return the visit result
    */ 
   @Override
   public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs)
    throws IOException
   {
      if (Files.isHidden(dir) || !Files.isReadable(dir)
        || Files.isSymbolicLink(dir))
      {
         invoker.info(String.format(
           "Walk skipping directory: %s", dir.toString()));
         return FileVisitResult.SKIP_SUBTREE;
      }

      // We don't need to check openin_any here as the starting
      // directory of the walk should already have been checked to
      // ensure it's on the CWD path.

      return FileVisitResult.CONTINUE;
   }


   /**
    * Invoked for a file in a directory. 
    *
    * Hidden files are automatically skipped, regardless of
    * openin_any. Files that don't have read access are also skipped
    * and so are symbolic files.
    *
    * @param file a reference to the file
    * @param attrs the file's basic attributes
    * @return the visit result
    */ 
   @Override
   public FileVisitResult visitFile(Path file, BasicFileAttributes attrs)
    throws IOException
   {
      if (Files.isHidden(file) || !Files.isReadable(file)
          || attrs.isSymbolicLink())
      {
         invoker.info(String.format(
           "Walk skipping file: %s", file.toString()));
         return FileVisitResult.CONTINUE;
      }

      // Does the file name match the supplied pattern?

      String name = file.getName(file.getNameCount()-1).toString();

      Matcher m = pattern.matcher(name);

      if (m.matches())
      {
         addPath(file);
      }

      return FileVisitResult.CONTINUE;
   }

   /**
    * Inserts path into results list according to the comparator. 
    * @param path the path to be added to the list
    */ 
   private void addPath(Path path)
   {
      int n = result.size();

      if (n == 0)
      {
         result.add(path);
         return;
      }

      for (int i = 0; i < n; i++)
      {
         Path thisPath = result.get(i);

         if (comparator.compare(thisPath, path) > 0)
         {
            result.add(i, path);
            return;
         }
      }

      result.add(path);
   }

   /**
    *Walks the path starting from the given directory, which must be the 
    *current working directory or a descendent. 
    */ 
   public static String walk(TeXOSQuery invoker, 
        String separator,
        String regex, 
        File directory,
        FileSortType sortType)
   throws IOException
   {
      if (!directory.exists())
      {
         throw new FileNotFoundException(
          String.format("No such file: %s", directory.toString()));
      }

      if (!directory.isDirectory())
      {
         throw new IOException(
          String.format("Not a directory: %s", directory.toString()));
      }

      directory = directory.getCanonicalFile();

      File cwd = new File(invoker.getSystemProperty("user.dir", "."));

      if (!cwd.equals(directory) && !invoker.isFileInTree(directory, cwd))
      {
         throw new IOException(
          String.format("Walk must start in current working directory path: %s",
           cwd.toString()));
      }

      Path start = directory.toPath();

      FileWalkVisitor visitor = new FileWalkVisitor(invoker, regex,
       new FilePathSortComparator(sortType));

      Files.walkFileTree(start, visitor);

      Vector<Path> result = visitor.getList();

      StringBuilder builder = new StringBuilder();

      for (Path path : result)
      {
         if (builder.length() > 0)
         {
            builder.append(separator);
         }

         builder.append(
           invoker.escapeFileName(start.relativize(path).toString()));
      }

      return builder.toString();
   }

   private TeXOSQuery invoker;
   private Pattern pattern;
   private Vector<Path> result;
   private Comparator<Path> comparator;
}
