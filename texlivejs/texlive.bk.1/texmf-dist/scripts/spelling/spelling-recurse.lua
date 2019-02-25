--- spelling-recurse.lua
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


--- Helper module for recursing into a node list.
-- This module provides means to recurse into a node list, calling
-- user-provided call-back functions upon certain events.
--
-- @author Stephan Hennig
-- @copyright 2012, 2013 Stephan Hennig
-- @release version 0.41
--
-- @trick Prevent LuaDoc from looking past here for module description.
--[[ Trick LuaDoc into entering 'module' mode without using that command.
module(...)
--]]


-- Module table.
local M = {}


-- Function short-cuts.
local traverse = node.traverse


-- Short-cuts for constants.
local HLIST = node.id('hlist')
local VLIST = node.id('vlist')


--- Scan a node list and call call-back functions upon certain events.
-- This function scans a node list.  Upon certain events, user-defined
-- call-back functions are called.  Call-back functions have to be
-- provided in a table.  Call-back functions and corresponding events
-- are:
--
-- <dl>
--
-- <dt>`vlist_pre_recurse`</dt> <dd>A vlist is about to be recursed
-- into.  Argument is the vlist node.</dd>
--
-- <dt>`vlist_post_recurse`</dt> <dd>Recursing into a vlist has been
-- finished.  Argument is the vlist node.</dd>
--
-- <dt>`hlist_pre_recurse`</dt> <dd>An hlist is about to be recursed
-- into.  Argument is the hlist node.</dd>
--
-- <dt>`hlist_post_recurse`</dt> <dd>Recursing into a hlist has been
-- finished.  Argument is the hlist node.</dd>
--
-- <dt>`visit`</dt> <dd>A node of type other that `vlist` and `hlist`
-- has been found.  Arguments are the head node of the current node
-- (head node of the current branch) and the current node.</dd>
--
-- </dl>
--
-- If a call-back entry in the table is `nil`, the corresponding event
-- is ignored.
--
-- @param head  Node list.
-- @param cb  Table of call-back functions.
local function recurse_node_list(head, cb)
  -- Make call-back functions local identifiers.
  local cb_vlist_pre_recurse = cb.vlist_pre_recurse
  local cb_vlist_post_recurse = cb.vlist_post_recurse
  local cb_hlist_pre_recurse = cb.hlist_pre_recurse
  local cb_hlist_post_recurse = cb.hlist_post_recurse
  local cb_visit_node = cb.visit_node
  -- Iterate over nodes in current branch.
  for n in traverse(head) do
    local nid = n.id
    -- Test for vlist node.
    if nid == VLIST then
      -- Announce vlist pre-traversal.
      if cb_vlist_pre_recurse then cb_vlist_pre_recurse(n) end
      -- Recurse into 'vlist'.
      recurse_node_list(n.head, cb)
      -- Announce vlist post-traversal.
      if cb_vlist_post_recurse then cb_vlist_post_recurse(n) end
    -- Test for hlist node.
    elseif nid == HLIST then
      -- Announce hlist pre-traversal.
      if cb_hlist_pre_recurse then cb_hlist_pre_recurse(n) end
      -- Recurse into 'hlist'.
      recurse_node_list(n.head, cb)
      -- Announce hlist post-traversal.
      if cb_hlist_post_recurse then cb_hlist_post_recurse(n) end
    -- Other nodes.
    else
      -- Visit node.
      if cb_visit_node then cb_visit_node(head, n) end
    end
  end
end
M.recurse_node_list = recurse_node_list


-- Return module table.
return M
