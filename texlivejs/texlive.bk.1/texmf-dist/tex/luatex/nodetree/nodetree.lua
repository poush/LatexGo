local nodex = {}
local tpl = {}
local tree = {}
tree.state = {}
local callbacks = {}
local base = {}
local options = {}
function nodex.node_id(n)
  return string.gsub(tostring(n), '^<node%s+%S+%s+<%s+(%d+).*', '%1')
end
function nodex.subtype(n)
  local typ = node.type(n.id)
  local subtypes = {
    hlist = {
      [0] = 'unknown',
      [1] = 'line',
      [2] = 'box',
      [3] = 'indent',
      [4] = 'alignment',
      [5] = 'cell',
      [6] = 'equation',
      [7] = 'equationnumber',
    },
    vlist = {
      [0] = 'unknown',
      [4] = 'alignment',
      [5] = 'cell',
    },
    rule = {
      [0] = 'unknown',
      [1] = 'box',
      [2] = 'image',
      [3] = 'empty',
      [4] = 'user',
    },
    adjust = {
      [0] = 'normal',
      [1] = 'pre',
    },
    boundary = {
      [0] = 'cancel',
      [1] = 'user',
      [2] = 'protrusion',
      [3] = 'word',
    },
    disc  = {
      [0] = 'discretionary',
      [1] = 'explicit',
      [2] = 'automatic',
      [3] = 'regular',
      [4] = 'first',
      [5] = 'second',
    },
    math = {
      [0] = 'beginmath',
      [1] = 'endmath',
    },
    glue = {
      [0]   = 'userskip',
      [1]   = 'lineskip',
      [2]   = 'baselineskip',
      [3]   = 'parskip',
      [4]   = 'abovedisplayskip',
      [5]   = 'belowdisplayskip',
      [6]   = 'abovedisplayshortskip',
      [7]   = 'belowdisplayshortskip',
      [8]   = 'leftskip',
      [9]   = 'rightskip',
      [10]  = 'topskip',
      [11]  = 'splittopskip',
      [12]  = 'tabskip',
      [13]  = 'spaceskip',
      [14]  = 'xspaceskip',
      [15]  = 'parfillskip',
      [16]  = 'mathskip',
      [17]  = 'thinmuskip',
      [18]  = 'medmuskip',
      [19]  = 'thickmuskip',
      [98]  = 'conditionalmathskip',
      [99]  = 'muglue',
      [100] = 'leaders',
      [101] = 'cleaders',
      [102] = 'xleaders',
      [103] = 'gleaders',
    },
    kern = {
      [0] = 'fontkern',
      [1] = 'userkern',
      [2] = 'accentkern',
      [3] = 'italiccorrection',
    },
    noad = {
      [0] = 'ord',
      [1] = 'opdisplaylimits',
      [2] = 'oplimits',
      [3] = 'opnolimits',
      [4] = 'bin',
      [5] = 'rel',
      [6] = 'open',
      [7] = 'close',
      [8] = 'punct',
      [9] = 'inner',
      [10] = 'under',
      [11] = 'over',
      [12] = 'vcenter',
    },
    radical = {
      [0] = 'radical',
      [1] = 'uradical',
      [2] = 'uroot',
      [3] = 'uunderdelimiter',
      [4] = 'uoverdelimiter',
      [5] = 'udelimiterunder',
      [6] = 'udelimiterover',
    },
    accent = {
      [0] = 'bothflexible',
      [1] = 'fixedtop',
      [2] = 'fixedbottom',
      [3] = 'fixedboth',
    },
    fence = {
      [0] = 'unset',
      [1] = 'left',
      [2] = 'middle',
      [3] = 'right',
    },
    glyph = {
      [0] = 'character',
      [1] = 'ligature',
      [2] = 'ghost',
      [3] = 'left',
      [4] = 'right',
    },
  }
  subtypes.whatsit = node.whatsits()
  local out = ''
  if subtypes[typ] and subtypes[typ][n.subtype] then
    out = subtypes[typ][n.subtype]
    if options.verbosity > 1 then
      out = out .. tpl.type_id(n.subtype)
    end
    return out
  else
    return tostring(n.subtype)
  end
  assert(false)
end
function tpl.round(number)
  local mult = 10^(options.decimalplaces or 0)
  return math.floor(number * mult + 0.5) / mult
end
function tpl.length(input)
  input = tonumber(input)
  input = input / tex.sp('1' .. options.unit)
  return string.format('%g%s', tpl.round(input), options.unit)
end
function tpl.fill(number, order, field)
  if order ~= nil and order ~= 0 then
    if field == 'stretch' then
      out = '+'
    else
      out = '-'
    end
    return out .. string.format(
      '%gfi%s', number / 2^16,
      string.rep('l', order - 1)
    )
  else
    return tpl.length(number)
  end
end
tpl.node_colors = {
  hlist = {'red', 'bright'},
  vlist = {'green', 'bright'},
  rule = {'blue', 'bright'},
  ins = {'blue'},
  mark = {'magenta'},
  adjust = {'cyan'},
  boundary = {'red', 'bright'},
  disc = {'green', 'bright'},
  whatsit = {'yellow', 'bright'},
  local_par = {'blue', 'bright'},
  dir = {'magenta', 'bright'},
  math = {'cyan', 'bright'},
  glue = {'magenta', 'bright'},
  kern = {'green', 'bright'},
  penalty = {'yellow', 'bright'},
  unset = {'blue'},
  style = {'magenta'},
  choice = {'cyan'},
  noad = {'red'},
  radical = {'green'},
  fraction = {'yellow'},
  accent = {'blue'},
  fence = {'magenta'},
  math_char = {'cyan'},
  sub_box = {'red', 'bright'},
  sub_mlist = {'green', 'bright'},
  math_text_char = {'yellow', 'bright'},
  delim = {'blue', 'bright'},
  margin_kern = {'magenta', 'bright'},
  glyph = {'cyan', 'bright'},
  align_record = {'red'},
  pseudo_file = {'green'},
  pseudo_line = {'yellow'},
  page_insert = {'blue'},
  split_insert = {'magenta'},
  expr_stack = {'cyan'},
  nested_list = {'red'},
  span = {'green'},
  attribute = {'yellow'},
  glue_spec = {'magenta'},
  attribute_list = {'cyan'},
  temp = {'magenta'},
  align_stack = {'red', 'bright'},
  movement_stack = {'green', 'bright'},
  if_stack = {'yellow', 'bright'},
  unhyphenated = {'magenta', 'bright'},
  hyphenated = {'cyan', 'bright'},
  delta = {'red'},
  passive = {'green'},
  shape = {'yellow'},
}
function tpl.color_code(code)
  return string.char(27) .. '[' .. tostring(code) .. 'm'
end
function tpl.color(color, mode, background)
  if options.color ~= 'colored' then
    return ''
  end
  local out = ''
  local code = ''
  if mode == 'bright' then
    out = tpl.color_code(1)
  elseif mode == 'dim' then
    out = tpl.color_code(2)
  end
  if not background then
    if color == 'reset' then code = 0
    elseif color == 'red' then code = 31
    elseif color == 'green' then code = 32
    elseif color == 'yellow' then code = 33
    elseif color == 'blue' then code = 34
    elseif color == 'magenta' then code = 35
    elseif color == 'cyan' then code = 36
    else code = 37 end
  else
    if color == 'black' then code = 40
    elseif color == 'red' then code = 41
    elseif color == 'green' then code = 42
    elseif color == 'yellow' then code = 43
    elseif color == 'blue' then code = 44
    elseif color == 'magenta' then code = 45
    elseif color == 'cyan' then code = 46
    elseif color == 'white' then code = 47
    else code = 40 end
  end
  return out .. tpl.color_code(code)
end
function tpl.key_value(key, value)
  local out = tpl.color('yellow') .. key .. ': '
  if value then
    out = out .. tpl.color('white') .. value .. '; '
  end
  return out .. tpl.color('reset')
end
function tpl.char(input)
  return string.format('%q', unicode.utf8.char(input))
end
function tpl.type(type, id)
  local out = tpl.color(
    tpl.node_colors[type][1],
    tpl.node_colors[type][2]
    )
    .. string.upper(type)
  if options.verbosity > 1 then
    out = out .. tpl.type_id(id)
  end
  return out .. tpl.color('reset')  .. ' '
end
function tpl.callback_variable(variable_name, variable)
  if variable ~= nil and variable ~= '' then
    tpl.print(variable_name .. ': ' .. tostring(variable))
  end
end
function tpl.line(length)
  if length == 'long' then
    return '------------------------------------------'
  else
    return '-----------------------'
  end
end
function tpl.callback(callback_name, variables)
  tpl.print('\n\n')
  tpl.print('Callback: ' .. tpl.color('red', '', true) ..
    callback_name .. tpl.color('reset')
  )
  if variables then
    for name, value in pairs(variables) do
      if value ~= nil and value ~= '' then
        tpl.print('  - ' .. name .. ': ' .. tostring(value))
      end
    end
  end
  tpl.print(tpl.line('long'))
end
function tpl.type_id(id)
  return '[' .. tostring(id) .. ']'
end
function tpl.branch(connection_type, connection_state, last)
  local c = connection_type
  local s = connection_state
  local l = last
  if c == 'list' and s == 'stop' and l == false then
    return '  '
  elseif c == 'field' and s == 'stop' and l == false then
    return '  '
  elseif c == 'list' and s == 'continue' and l == false then
    return '│ '
  elseif c == 'field' and s == 'continue' and l == false then
    return '║ '
  elseif c == 'list' and s == 'continue' and l == true then
    return '├─'
  elseif c == 'field' and s == 'continue' and l == true then
    return '╠═'
  elseif c == 'list' and s == 'stop' and l == true then
    return '└─'
  elseif c == 'field' and s == 'stop' and l == true then
    return '╚═'
  end
end
function tpl.branches(level, connection_type)
  local out = ''
  for i = 1, level - 1  do
    out = out .. tpl.branch('list', tree.state[i]['list'], false)
    out = out .. tpl.branch('field', tree.state[i]['field'], false)
  end
  if connection_type == 'list' then
    out = out .. tpl.branch('list', tree.state[level]['list'], true)
  else
    out = out .. tpl.branch('list', tree.state[level]['list'], false)
    out = out .. tpl.branch('field', tree.state[level]['field'], true)
  end
  return out
end
function tpl.print(text)

  if options.channel == 'log' then
    if not log then
      log = io.open(tex.jobname .. '_nodetree.log', 'a')
    end
    log:write(text, '\n')
  else
    print('  ' .. text)
  end
end
function tree.format_field(head, field)
  local out = ''
  if not head[field] or head[field] == 0 then
    return ''
  end
  if options.verbosity < 2 and
    -- glyph
    field == 'font' or
    field == 'left' or
    field == 'right' or
    field == 'uchyph' or
    -- hlist
    field == 'dir' or
    field == 'glue_order' or
    field == 'glue_sign' or
    field == 'glue_set' or
    -- glue
    field == 'stretch_order' then
    return ''
  elseif options.verbosity < 3 and
    field == 'prev' or
    field == 'next' or
    field == 'id'
  then
    return ''
  end
  if field == 'prev' or field == 'next' then
    out = nodex.node_id(head[field])
  elseif field == 'subtype' then
    out = nodex.subtype(head)
  elseif
    field == 'width' or
    field == 'height' or
    field == 'depth' or
    field == 'kern' or
    field == 'shift' then
    out = tpl.length(head[field])
  elseif field == 'char' then
    out = tpl.char(head[field])
  elseif field == 'glue_set' then
    out = tpl.round(head[field])
  elseif field == 'stretch' or field == 'shrink' then
    out = tpl.fill(head[field], head[field .. '_order'], field)
  else
    out = tostring(head[field])
  end
  return tpl.key_value(field, out)
end
function tree.set_state(level, connection_type, connection_state)
  if not tree.state[level] then
    tree.state[level] = {}
  end
  tree.state[level][connection_type] = connection_state
end
function tree.analyze_fields(fields, level)
  local max = 0
  local connection_state = ''
  for _ in pairs(fields) do
    max = max + 1
  end
  local count = 0
  for field_name, recursion_node in pairs(fields) do
    count = count + 1
    if count == max then
      connection_state = 'stop'
    else
      connection_state = 'continue'
    end
    tree.set_state(level, 'field', connection_state)
    tpl.print(tpl.branches(level, 'field') .. tpl.key_value(field_name))
    tree.analyze_list(recursion_node, level + 1)
  end
end
function tree.analyze_node(head, level)
  local connection_state
  local out = ''
  if head.next then
    connection_state = 'continue'
  else
    connection_state = 'stop'
  end
  tree.set_state(level, 'list', connection_state)
  out = tpl.branches(level, 'list')
    .. tpl.type(node.type(head.id), head.id)
  if options.verbosity > 1 then
    out = out .. tpl.key_value('no', nodex.node_id(head))
  end
  local fields = {}
  for field_id, field_name in pairs(node.fields(head.id, head.subtype)) do
    if field_name ~= 'next' and
      field_name ~= 'prev' and
      node.is_node(head[field_name]) then
      fields[field_name] = head[field_name]
    else
      out = out .. tree.format_field(head, field_name)
    end
  end
  tpl.print(out)
  tree.analyze_fields(fields, level)
end
function tree.analyze_list(head, level)
  while head do
    tree.analyze_node(head, level)
    head = head.next
  end
end
function tree.analyze_callback(head)
  tree.analyze_list(head, 1)
  tpl.print(tpl.line('short') .. '\n')
end
function callbacks.contribute_filter(extrainfo)
  tpl.callback('contribute_filter', {extrainfo = extrainfo})
  return true
end
function callbacks.buildpage_filter(extrainfo)
  tpl.callback('buildpage_filter', {extrainfo = extrainfo})
  return true
end
function callbacks.pre_linebreak_filter(head, groupcode)
  tpl.callback('pre_linebreak_filter', {groupcode = groupcode})
  tree.analyze_callback(head)
  return true
end
function callbacks.linebreak_filter(head, is_display)
  tpl.callback('linebreak_filter', {is_display = is_display})
  tree.analyze_callback(head)
  return true
end
function callbacks.append_to_vlist_filter(head, locationcode, prevdepth, mirrored)
  local variables = {
    locationcode = locationcode,
    prevdepth = prevdepth,
    mirrored = mirrored,
  }
  tpl.callback('append_to_vlist_filter', variables)
  tree.analyze_callback(head)
  return true
end
function callbacks.post_linebreak_filter(head, groupcode)
  tpl.callback('post_linebreak_filter', {groupcode = groupcode})
  tree.analyze_callback(head)
  return true
end
function callbacks.hpack_filter(head, groupcode, size, packtype, direction, attributelist)
  local variables = {
    groupcode = groupcode,
    size = size,
    packtype = packtype,
    direction = direction,
    attributelist = attributelist,
  }
  tpl.callback('hpack_filter', variables)
  tree.analyze_callback(head)
  return true
end
function callbacks.vpack_filter(head, groupcode, size, packtype, maxdepth, direction, attributelist)
  local variables = {
    groupcode = groupcode,
    size = size,
    packtype = packtype,
    maxdepth = tpl.length(maxdepth),
    direction = direction,
    attributelist = attributelist,
  }
  tpl.callback('vpack_filter', variables)
  tree.analyze_callback(head)
  return true
end
function callbacks.hpack_quality(incident, detail, head, first, last)
  local variables = {
    incident = incident,
    detail = detail,
    first = first,
    last = last,
  }
  tpl.callback('hpack_quality', variables)
  tree.analyze_callback(head)
end
function callbacks.vpack_quality(incident, detail, head, first, last)
  local variables = {
    incident = incident,
    detail = detail,
    first = first,
    last = last,
  }
  tpl.callback('vpack_quality', variables)
  tree.analyze_callback(head)
end
function callbacks.process_rule(head, width, height)
  local variables = {
    width = width,
    height = height,
  }
  tpl.callback('process_rule', variables)
  tree.analyze_callback(head)
  return true
end
function callbacks.pre_output_filter(head, groupcode, size, packtype, maxdepth, direction)
  local variables = {
    groupcode = groupcode,
    size = size,
    packtype = packtype,
    maxdepth = maxdepth,
    direction = direction,
  }
  tpl.callback('pre_output_filter', variables)
  tree.analyze_callback(head)
  return true
end
function callbacks.hyphenate(head, tail)
  tpl.callback('hyphenate')
  tpl.print('head:')
  tree.analyze_callback(head)
  tpl.print('tail:')
  tree.analyze_callback(tail)
end
function callbacks.ligaturing(head, tail)
  tpl.callback('ligaturing')
  tpl.print('head:')
  tree.analyze_callback(head)
  tpl.print('tail:')
  tree.analyze_callback(tail)
end
function callbacks.kerning(head, tail)
  tpl.callback('kerning')
  tpl.print('head:')
  tree.analyze_callback(head)
  tpl.print('tail:')
  tree.analyze_callback(tail)
end
function callbacks.insert_local_par(local_par, location)
  tpl.callback('insert_local_par', {location = location})
  tree.analyze_callback(local_par)
  return true
end
function callbacks.mlist_to_hlist(head, display_type, need_penalties)
  local variables = {
    display_type = display_type,
    need_penalties = need_penalties,
  }
  tpl.callback('mlist_to_hlist', variables)
  tree.analyze_callback(head)
  return node.mlist_to_hlist(head, display_type, need_penalties)
end
function base.normalize_options()
  options.verbosity = tonumber(options.verbosity)
  options.decimalplaces = tonumber(options.decimalplaces)
end
function base.set_default_options()
  local defaults = {
    verbosity = 1,
    callback = 'postlinebreak',
    engine = 'luatex',
    color = 'colored',
    decimalplaces = 2,
    unit = 'pt',
    channel = 'term',
  }
  if not options then
    options = {}
  end
  for key, value in pairs(defaults) do
    if not options[key] then
      options[key] = value
    end
  end
  base.normalize_options()
end
function base.set_option(key, value)
  if not options then
    options = {}
  end
  options[key] = value
  base.normalize_options()
end
function base.get_option(key)
  if not options then
    options = {}
  end
  if options[key] then
    return options[key]
  end
end
function base.get_callback_name(alias)
  if alias == 'contribute' or alias == 'contributefilter' then
    return 'contribute_filter'
  elseif alias == 'buildpage' or alias == 'buildpagefilter' then
    return 'buildpage_filter'
  elseif alias == 'preline' or alias == 'prelinebreakfilter' then
    return 'pre_linebreak_filter'
  elseif alias == 'line' or alias == 'linebreakfilter' then
    return 'linebreak_filter'
  elseif alias == 'append' or alias == 'appendtovlistfilter' then
    return 'append_to_vlist_filter'
  elseif alias == 'postline' or alias == 'postlinebreakfilter' then
    return 'post_linebreak_filter'
  elseif alias == 'hpack' or alias == 'hpackfilter' then
    return 'hpack_filter'
  elseif alias == 'vpack' or alias == 'vpackfilter' then
    return 'vpack_filter'
  elseif alias == 'hpackq' or alias == 'hpackquality' then
    return 'hpack_quality'
  elseif alias == 'vpackq' or alias == 'vpackquality' then
    return 'vpack_quality'
  elseif alias == 'process' or alias == 'processrule' then
    return 'process_rule'
  elseif alias == 'preout' or alias == 'preoutputfilter' then
    return 'pre_output_filter'
  elseif alias == 'hyph' or alias == 'hyphenate' then
    return 'hyphenate'
  elseif alias == 'liga' or alias == 'ligaturing' then
    return 'ligaturing'
  elseif alias == 'kern' or alias == 'kerning' then
   return 'kerning'
  elseif alias == 'insert' or alias == 'insertlocalpar' then
    return 'insert_local_par'
  elseif alias == 'mhlist' or alias == 'mlisttohlist' then
    return 'mlist_to_hlist'
  else
    return 'post_linebreak_filter'
  end
end
function base.register(cb)
  if options.engine == 'lualatex' then
    luatexbase.add_to_callback(cb, callbacks[cb], 'nodetree')
  else
    id, error = callback.register(cb, callbacks[cb])
  end
end
function base.register_callbacks()
  for alias in string.gmatch(options.callback, '([^,]+)') do
    base.register(base.get_callback_name(alias))
  end
end
function base.unregister(cb)
  if options.engine == 'lualatex' then
    luatexbase.remove_from_callback(cb, 'nodetree')
  else
    id, error = callback.register(cb, nil)
  end
end
function base.unregister_callbacks()
  for alias in string.gmatch(options.callback, '([^,]+)') do
    base.unregister(base.get_callback_name(alias))
  end
end
function base.execute()
  local c = base.get_callback()
  if options.engine == 'lualatex' then
    luatexbase.add_to_callback(c, callbacks.post_linebreak_filter, 'nodetree')
  else
    id, error = callback.register(c, callbacks.post_linebreak_filter)
  end
end
function base.analyze(head)
  tpl.print('\n')
  tree.analyze_list(head, 1)
end
return base
