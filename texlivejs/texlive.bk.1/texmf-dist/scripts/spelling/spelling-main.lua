--- spelling-main.lua
--- Copyright 2012, 2013 Stephan Hennig
--
-- This work may be distributed and/or modified under the conditions of
-- the LaTeX Project Public License, either version 1.3 of this license
-- or (at your option) any later version.  The latest version of this
-- license is in http://www.latex-project.org/lppl.txt
-- and version 1.3 or later is part of all distributions of LaTeX
-- version 2005/12/01 or later.
--
-- See file README for more information.
--


--- Main Lua file.
--
-- @author Stephan Hennig
-- @copyright 2012, 2013 Stephan Hennig
-- @release version 0.41
--


-- Module identification.
if luatexbase.provides_module then
  luatexbase.provides_module(
    {
      name        = 'spelling',
      date        = '2013/05/25',
      version     = '0.41',
      description = 'support for spell-checking of LuaTeX documents',
      author      = 'Stephan Hennig',
      licence     = 'LPPL ver. 1.3c',
    }
  )
end


--- Global table of modules.
-- The work of the spelling package can be separated into four
-- stages:<br />
--
-- <dl>
--
-- <dt>Stage 1</dt>
--   <dd><ul>
--     <li>Load bad strings.</li>
--     <li>Load good strings.</li>
--     <li>Handle match rules.</li>
--   </ul></dd>
--
-- <dt>Stage 2  (call-back <code>pre_linebreak_filter</code>)</dt>
--   <dd><ul>
--     <li>Tag word strings in node lists before paragraph breaking
--         takes place.</li>
--     <li>Check spelling of strings.</li>
--     <li>Highlight strings with known incorrect spelling in PDF
--         output.</li>
--   </ul></dd>
--
-- <dt>Stage 3  (<code>\AtBeginShipout</code>)</dt>
--   <dd><ul>
--     <li>Store all strings found on built page via tag nodes in text
--         document data structure.</li>
--   </ul></dd>
--
-- <dt>Stage 4  (call-back <code>stop_run</code>)</dt>
--   <dd><ul>
--     <li>Output text stored in text document data structure to a
--         file.</li>
--   </ul></dd>
--
-- </dl>
--
-- The code of the spelling package is organized in modules reflecting
-- these stages.  References to modules are stored in a table.  Table
-- indices correspond to the stages as shown above.  The table of module
-- references is shared in a global table (`PKG_spelling`) so that
-- public module functions are accessible from within external code.<br
-- />
--
-- <ul>
--   <li><code>spelling-stage-1.lua : stage[1]</code></li>
--   <li><code>spelling-stage-2.lua : stage[2]</code></li>
--   <li><code>spelling-stage-3.lua : stage[3]</code></li>
--   <li><code>spelling-stage-4.lua : stage[4]</code></li>
-- </ul>
--
-- @class table
-- @name stage
stage = {}


--- Table of package-wide resources that are shared among several
--- modules.
--
-- @class table
-- @name res
--
-- @field rules_bad  Table.<br />
--
-- This table contains all bad rules.  Spellings can be matched against
-- these rules.
--
-- @field rules_good  Table.<br />
--
-- This table contains all good match rules.  Spellings can be matched
-- against these rules.
--
-- @field text_document  Table.<br />
--
-- Data structure that stores the text of a document.  The text document
-- data structure stores the text of a document.  The data structure is
-- quite simple.  A text document is an ordered list (an array) of
-- paragraphs.  A paragraph is an ordered list (an array) of words.  A
-- word is a single UTF-8 encoded string.<br />
--
-- During the LuTeX run, node lists are scanned for strings before
-- hyphenation takes place.  The strings found in a node list are stored
-- in the current paragraph.  After finishing scanning a node list, the
-- current paragraph is inserted into the text document.  At the end of
-- the LuaTeX run, all paragraphs of the text document are broken into
-- lines of a fixed length and the lines are written to a file.<br />
--
-- Here's the rationale of this approach:
--
-- <ul>
--
-- <li> It reduces file access <i>during</i> the LuaTeX run by delaying
--   write operations until the end.
--
-- <li> It saves space.  In Lua, strings are internalized.  Since in a
--   document, the same words are used over and over again, relatively
--   few strings are actually stored in memory.
--
-- <li> It allows for pre-processing the text document before writing it
--   to a file.
--
-- </ul>
--
-- @field whatsit_uid  Number.<br />
--
-- Unique ID for marking user-defined whatsit nodes created by this
-- package.  The ID is generated at run-time.  See this <a
-- href="https://github.com/mpg/luatexbase/issues/8">GitHub issue</a>.
--
local res = {

  rules_bad,
  rules_good,
  text_document,
  whatsit_ids,

}


--- Global package table.
-- This global table provides access to package-wide variables from
-- within other chunks.
--
-- @class table
-- @name PKG_spelling
PKG_spelling = {}


--- Determine unique IDs for user-defined whatsit nodes used by this
-- package.  Package luatexbase provides user-defined whatsit node ID
-- allocation since version v0.6 (TL 2013).  For older package versions,
-- we start allocating at an arbitrary hard-coded value of 13**8
-- (ca. 2**30).  Note, for compatibility with LuaTeX 0.70.2, the value
-- must be less than 2^31.
--
-- @return Table mapping names to IDs.
local function __allocate_whatsit_ids()
  local ids = {}
  -- Allocation support present?
  if luatexbase.new_user_whatsit_id then
    ids.start_tag = luatexbase.new_user_whatsit_id('start_tag', 'spelling')
    ids.end_tag = luatexbase.new_user_whatsit_id('end_tag', 'spelling')
  else
    local uid = 13^8
    ids.start_tag = uid + 1
    ids.end_tag = uid + 2
  end
  return ids
end


--- Package initialisation.
--
local function __init()
  -- Create resources.
  res.rules_bad = {}
  res.rules_good = {}
  res.text_document = {}
  res.whatsit_ids = __allocate_whatsit_ids()
  -- Provide global access to package ressources during module loading.
  PKG_spelling.res = res
  -- Load sub-modules:
  -- * bad and good string loading
  -- * match rule handling
  stage[1] = require 'spelling-stage-1'
  -- * node list tagging
  -- * spell-checking
  -- * bad string highlighting
  stage[2] = require 'spelling-stage-2'
  -- * text storage
  stage[3] = require 'spelling-stage-3'
  -- * text output
  stage[4] = require 'spelling-stage-4'
  -- Remove global reference to package ressources.
  PKG_spelling.res = nil
  -- Provide global access to module references.
  PKG_spelling.stage = stage
  -- Enable text storage.
  stage[3].enable_text_storage()
end


-- Initialize package.
__init()
