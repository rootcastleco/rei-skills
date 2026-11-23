# Astryx Component & Hook Reference

> Extracted from [meta/astryx](https://github.com/meta/astryx) (`@astryxdesign/core@0.7.18`) — 176 components, 87 hooks, 9 utilities.

## Action (10)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Button` | component | `@astryxdesign/core/Button` | `label*`, `variant`, `size`, `elevation`, `type` | Button triggers an action when clicked. Use it for form submissions, confirmations, navigation, or any interaction that needs a clear call t |
| `ButtonGroup` | component | `@astryxdesign/core/ButtonGroup` | — | ButtonGroup joins related actions into a single connected control. Use it when multiple buttons represent related choices or operations that |
| `ContextMenu` | component | `@astryxdesign/core/ContextMenu` | `children*`, `items`, `menuContent`, `menuWidth`, `size` | A right-click context menu that appears at the cursor position. Use to provide contextual actions for specific elements or regions without c |
| `DropdownMenu` | component | `@astryxdesign/core/DropdownMenu` | `button`, `renderTrigger`, `items*`, `presentation`, `isMenuOpen` | A dropdown menu that displays a list of actionable items in a popup triggered by a button. Use to present action options as a next step in a |
| `IconButton` | component | `@astryxdesign/core/IconButton` | `label*`, `icon*`, `variant`, `size`, `elevation` | A button that shows only an icon with no visible text. Use IconButton in toolbars, table rows, and compact UI where space is tight and the i |
| `Link` | component | `@astryxdesign/core/Link` | — | A styled anchor for inline and standalone text navigation. Supports external links, underline variants, tooltips, and custom link components |
| `MoreMenu` | component | `@astryxdesign/core/MoreMenu` | `items*`, `label`, `variant`, `size`, `icon` | MoreMenu is a three-dot button that opens a list of actions. Use it for secondary actions that don't need to be always visible, like in tabl |
| `SegmentedControl` | component | `@astryxdesign/core/SegmentedControl` | `value*`, `onChange*`, `label*`, `size`, `layout` | A segmented button group that allows users to make a single selection from a small set of mutually exclusive options. Use SegmentedControl w |
| `ToggleButton` | component | `@astryxdesign/core/ToggleButton` | `label*`, `isPressed`, `onPressedChange`, `pressedChangeAction`, `size` | ToggleButton switches between selected and unselected states to represent a persistent on/off choice. Use it standalone for binary actions l |
| `Toolbar` | component | `@astryxdesign/core/Toolbar` | — | Toolbar is a horizontal bar with left, center, and right areas. Use it for contextual actions within a content area (above a table, inside a |

## Chat (3)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Chat` | component | `@astryxdesign/core/Chat` | — | Chat is a family of composable primitives for building AI and human chat experiences. Combine ChatLayout, ChatMessageList, ChatMessage, bubb |
| `ChatDictationButton` | component | `@astryxdesign/core/Chat` | `dictation*`, `size`, `isHiddenWhenUnsupported`, `label`, `xstyle` | ChatDictationButton is a toggle button that starts and stops voice dictation inside a chat composer. It pairs with useChatDictation to show  |
| `ChatToolCalls` | component | `@astryxdesign/core/Chat` | `calls*`, `label`, `isExpanded`, `defaultIsExpanded`, `onExpandedChange` | ChatToolCalls displays tool or function call invocations from an LLM response. Pass an array of calls and the component handles the rest: a  |

## Container (5)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Card` | component | `@astryxdesign/core/Card` | `width`, `height`, `maxWidth`, `minHeight`, `children` | Card is a bordered, elevated container for discrete, self-contained items: things you could reorder, remove, or interact with independently. |
| `Carousel` | component | `@astryxdesign/core/Carousel` | `children*`, `gap`, `hasButtons`, `hasEdgeFade`, `hasLoop` | Carousel scrolls a row of items horizontally when they overflow the available width. Use it for card grids, image galleries, product lists,  |
| `ClickableCard` | component | `@astryxdesign/core/ClickableCard` | `label*`, `onClick`, `href`, `target`, `isDisabled` | An interactive card for navigation or action targets. Nested interactive elements work independently. |
| `Collapsible` | component | `@astryxdesign/core/Collapsible` | `trigger*`, `children`, `defaultIsOpen`, `isOpen`, `isDisabled` | Collapsible hides and reveals content behind a trigger button. Use it in settings panels, FAQ pages, or detail views to keep the page scanna |
| `SelectableCard` | component | `@astryxdesign/core/SelectableCard` | `label*`, `isSelected*`, `onChange*`, `isDisabled`, `children` | A card that toggles between selected and unselected states with an accent border. For navigation use ClickableCard. |

## Content (15)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Avatar` | component | `@astryxdesign/core/Avatar` | `src`, `fallbackSrc`, `name`, `alt`, `size` | Avatar represents a person or team with a profile photo, initials, or a default icon. Use it in comment headers, contact lists, chat message |
| `AvatarGroup` | component | `@astryxdesign/core/AvatarGroup` | `children*`, `size`, `shape`, `ref`, `xstyle` | AvatarGroup displays multiple avatars in an overlapping row with an optional overflow indicator. Uses a compositional API: pass Avatar child |
| `Blockquote` | component | `@astryxdesign/core/Blockquote` | `children*`, `cite`, `xstyle` | A quotation block with a rule on its inline-start edge and secondary text color. Use to highlight quoted content, testimonials, or excerpts. |
| `Citation` | component | `@astryxdesign/core/Citation` | `source*`, `number*`, `variant` | Citations display inline references to external sources. Use them to attribute information within AI-generated responses, articles, or anywh |
| `Code` | component | `@astryxdesign/core/Code` | `children*`, `color`, `size`, `ref`, `xstyle` | Code marks short inline references such as function names, variables, file paths, and command-line flags. Use CodeBlock for standalone or mu |
| `CodeBlock` | component | `@astryxdesign/core/CodeBlock` | `code*`, `language`, `title`, `hasLanguageLabel`, `hasLineNumbers` | CodeBlock renders syntax-highlighted code with line numbers, a copy button, and optional collapsible sections. Use CodeBlock for multi-line  |
| `EmptyState` | component | `@astryxdesign/core/EmptyState` | `title*`, `description`, `icon`, `actions`, `headingLevel` | EmptyState shows a placeholder when a content area has no data. Use it for empty lists, zero search results, first-time setups, or cleared i |
| `Icon` | component | `@astryxdesign/core/Icon` | `icon*`, `color`, `size`, `variant`, `label` | Icons are small visual symbols that represent actions, objects, or concepts. They improve scannability and reinforce meaning alongside text. |
| `Kbd` | component | `@astryxdesign/core/Kbd` | `keys*`, `xstyle`, `className`, `style`, `ref` | Renders a keyboard shortcut as styled key badges. Use Kbd in menus and help text to show key combinations; in a Tooltip, write the shortcut  |
| `Markdown` | component | `@astryxdesign/core/Markdown` | `children*`, `display`, `density`, `headingLevelStart`, `isStreaming` | Renders a markdown string as Astryx-styled components. Use Markdown for user-generated content, AI responses, and documentation; it handles  |
| `Text` | component | `@astryxdesign/core/Text` | `type`, `children*`, `size`, `color`, `weight` | Text renders styled body text and headings from the theme. Use Text with a semantic type for body copy, labels, and captions, and Heading fo |
| `Thumbnail` | component | `@astryxdesign/core/Thumbnail` | `src`, `alt`, `label`, `onRemove`, `onClick` | Thumbnail displays a compact, square preview of an image attachment. It shows a shimmer effect while uploading, the image on success, and a  |
| `Timer` | component | `@astryxdesign/core/Timer` | `startTime`, `format`, `type`, `size`, `color` | Displays a standardized elapsed duration for active work without scheduling a React render on every tick. Elapsed format updates by second b |
| `Timestamp` | component | `@astryxdesign/core/Timestamp` | `value*`, `format`, `timezoneID`, `autoThreshold`, `hasTooltip` | Timestamp formats a date or time value into human-readable text. Use it to show when something was created, updated, or is scheduled; pickin |
| `Token` | component | `@astryxdesign/core/Token` | `label*`, `size`, `color`, `icon`, `isDisabled` | Token is a small, inline element for representing discrete pieces of associated data, like tags, categories, or selections. Use it to label  |

## Feedback & Status (7)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Badge` | component | `@astryxdesign/core/Badge` | `variant`, `label*`, `icon` | Badge highlights a status or category at a glance. Use it sparingly: only when a value represents a distinct state (Active, Failed) or a gro |
| `Banner` | component | `@astryxdesign/core/Banner` | `status*`, `title*`, `description`, `icon`, `isDismissable` | Banner shows a persistent message at the top of a page or section. Use it for form errors, system updates, maintenance notices, or success c |
| `InfoTip` | component | `@astryxdesign/core/InfoTip` | `content*`, `label`, `size`, `xstyle` | An info icon that reveals help: a small "i" button. Hover and keyboard focus preview the help, and a click, tap, Enter, or Space pins it ope |
| `ProgressBar` | component | `@astryxdesign/core/ProgressBar` | `label*`, `value`, `max`, `isLabelHidden`, `hasValueLabel` | A horizontal bar showing the completion progress of a task. Use it for operations where the duration is known, or as an animated indicator w |
| `Skeleton` | component | `@astryxdesign/core/Skeleton` | `width`, `height`, `radius`, `index` | An animated shimmer placeholder that previews the shape of content while it loads. Use it to build loading screens that match the layout of  |
| `Spinner` | component | `@astryxdesign/core/Spinner` | `size`, `shade`, `label`, `aria-label`, `xstyle` | An animated loading indicator for processes with unknown duration, such as data fetching or form submission. Supports visible labels, multip |
| `StatusDot` | component | `@astryxdesign/core/StatusDot` | `variant*`, `label*`, `isPulsing`, `tooltip`, `icon` | A small colored dot that communicates status like online/offline presence or severity levels. Supports five semantic variants and an optiona |

## Form Controls (24)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Calendar` | component | `@astryxdesign/core/Calendar` | `mode`, `value`, `defaultValue`, `onChange`, `numberOfMonths` | Calendar lets the user pick a date or date range from a month grid. Use it in booking flows, scheduling UIs, date filters, or anywhere the u |
| `CheckboxInput` | component | `@astryxdesign/core/CheckboxInput` | `ref`, `label*`, `isLabelHidden`, `description`, `value*` | CheckboxInput toggles a single on/off value. Use it for settings like "Enable notifications", terms acceptance, or opt-in choices. For multi |
| `CheckboxList` | component | `@astryxdesign/core/CheckboxList` | `label*`, `children*`, `value`, `onChange`, `changeAction` | CheckboxList shows a small group of checkboxes so users can turn several options on or off at once. Place it in settings pages, filter panel |
| `ComplexSelector` | component | `@astryxdesign/core/ComplexSelector` | — | Use ComplexSelector when a selection needs richer custom content than a Selector option row. It is intentionally one component: ComplexSelec |
| `DateInput` | component | `@astryxdesign/core/DateInput` | `label*`, `isLabelHidden`, `description`, `isOptional`, `isRequired` | DateInput lets the user type or pick a date from a calendar popover. Use it for scheduling, deadlines, booking dates, or any form field that |
| `DateRangeInput` | component | `@astryxdesign/core/DateRangeInput` | `label*`, `isLabelHidden`, `description`, `isOptional`, `isRequired` | DateRangeInput lets users select a start and end date from a dual-month calendar popover. Use it for filtering data by time period, report g |
| `DateTimeInput` | component | `@astryxdesign/core/DateTimeInput` | `label*`, `isLabelHidden`, `description`, `isOptional`, `isRequired` | DateTimeInput combines date and time selection in one field. With presentation="adaptive-native" (the default), mouse/trackpad devices use A |
| `Field` | component | `@astryxdesign/core/Field` | `label*`, `inputID*`, `labelID`, `isGroupLabel`, `children*` | Field is a low-level wrapper for custom, native, or third-party controls that do not already provide field label, description, and status UI |
| `FieldStatus` | component | `@astryxdesign/core/FieldStatus` | `type*`, `message*`, `id`, `variant` | FieldStatus renders validation feedback for fields and field-like controls. Use it directly for custom controls that need the same error, wa |
| `FileInput` | component | `@astryxdesign/core/FileInput` | `label*`, `value*`, `onChange*`, `changeAction`, `accept` | FileInput provides file upload with optional drag-and-drop support. Use it for single or multiple file selection with built-in validation fo |
| `Indicator` | component | `@astryxdesign/core/Indicator` | — | Indicators are the componentized selection visuals shared by CheckboxInput, RadioList, and menu selection rows. They are decorative: the own |
| `InputGroup` | component | `@astryxdesign/core/InputGroup` | `children*`, `label*`, `isLabelHidden`, `description`, `isDisabled` | InputGroup connects an input with prefix/suffix addons in a single visual unit. Use it for URL fields, currency inputs, search fields with a |
| `MultiSelector` | component | `@astryxdesign/core/MultiSelector` | — | A checkbox dropdown for selecting multiple values from a list. Selected items can display as a count, labels, or badges. Use it for filterin |
| `NumberInput` | component | `@astryxdesign/core/NumberInput` | `label*`, `value*`, `onChange*`, `size`, `isLabelHidden` | A form input for numeric values with built-in validation, min/max constraints, and step controls. Use NumberInput for quantities, measuremen |
| `PowerSearch` | component | `@astryxdesign/core/PowerSearch` | `config*`, `filters*`, `onChange*`, `label`, `isLabelHidden` | PowerSearch is a structured filter bar where each token represents a field, operator, and value. Use it for complex multi-dimensional filter |
| `RadioList` | component | `@astryxdesign/core/RadioList` | `label*`, `value*`, `onChange*`, `children*`, `isLabelHidden` | A group of options where only one can be selected at a time. All options are visible at once, making it easy to compare choices. Use it when |
| `Selector` | component | `@astryxdesign/core/Selector` | `label*`, `options*`, `value`, `onChange`, `changeAction` | A dropdown selector for choosing a single value from a list of options. Supports labels, validation, descriptions, and required/optional sta |
| `Slider` | component | `@astryxdesign/core/Slider` | `label*`, `value*`, `onChange`, `onChangeEnd`, `min` | A draggable control for selecting a numeric value or range within defined bounds. Supports single value and range selection, tick marks, cus |
| `Switch` | component | `@astryxdesign/core/Switch` | `ref`, `label*`, `value*`, `onChange`, `changeAction` | A toggle control for on/off states that take effect immediately. Supports labels, descriptions, loading states, and validation. Use it for s |
| `TextArea` | component | `@astryxdesign/core/TextArea` | `ref`, `label*`, `value*`, `onChange`, `changeAction` | TextArea is a multi-line text input for collecting longer-form content like comments, descriptions, or messages. Use it when the expected in |
| `TextInput` | component | `@astryxdesign/core/TextInput` | `type`, `label*`, `value*`, `onChange`, `changeAction` | TextInput collects short-form text like names, emails, or search queries. Use it for single-line values where the expected input is brief. P |
| `TimeInput` | component | `@astryxdesign/core/TimeInput` | `label*`, `isLabelHidden`, `description`, `isOptional`, `isRequired` | TimeInput uses a browser/OS time picker on coarse pointers by default and Astryx's typed field on fine pointers. It converts values to a sta |
| `Tokenizer` | component | `@astryxdesign/core/Tokenizer` | `label*`, `searchSource*`, `value*`, `onChange*`, `placeholder` | Tokenizer is a multi-select input that lets users search, select, and manage multiple items displayed as removable chips. Use it when users  |
| `Typeahead` | component | `@astryxdesign/core/Typeahead` | `label*`, `searchSource*`, `value*`, `onChange*`, `placeholder` | A searchable input for selecting a single item from a large or dynamic dataset. Results appear as the user types, with support for async dat |

## General (69)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `AvatarGroupOverflow` | component | `@astryxdesign/core/AvatarGroup` | `count*`, `children`, `onClick`, `ref`, `xstyle` | AvatarGroupOverflow appears at the end of an AvatarGroup to summarize people who are not shown individually. Use it when a group is sliced t |
| `AvatarStatusDot` | component | `@astryxdesign/core/Avatar` | `variant`, `label`, `icon` | Size-aware status indicator dot that reads avatar size from context and scales proportionally. Each variant pairs a colour with a distinct b |
| `BaseTypeahead` | component | `@astryxdesign/core/Typeahead` | `searchSource*`, `value*`, `onChange*`, `renderItem`, `placeholder` | Composable combobox engine providing a bare input, search, keyboard navigation, and a styled result dropdown. It renders no input wrapper, b |
| `BreadcrumbItem` | component | `@astryxdesign/core/Breadcrumbs` | `children*`, `href`, `onClick`, `isCurrent`, `startIcon` | BreadcrumbItem represents one destination, action, current location, or sibling-menu trigger inside a Breadcrumbs trail. |
| `ChatComposer` | component | `@astryxdesign/core/Chat` | `onSubmit*`, `onStop`, `isStopShown`, `value`, `onChange` | ChatComposer is the message-entry shell for a chat surface. It coordinates a controlled or uncontrolled draft, provides a default token-capa |
| `ChatComposerDrawer` | component | `@astryxdesign/core/Chat` | `children*`, `count`, `label`, `collapsedSummary`, `isCollapsed` | Use ChatComposerDrawer in the ChatComposer drawer slot for supplementary content such as attachments, context chips, or previews. Provide co |
| `ChatComposerInput` | component | `@astryxdesign/core/Chat` | `handleRef`, `value`, `onChange`, `placeholder`, `maxRows` | Pass ChatComposerInput to ChatComposer's input slot when the draft needs trigger menus, inline tokens, history recall, dictation insertion,  |
| `ChatComposerTokenElement` | component | `@astryxdesign/core/Chat` | `token*` | Renders a single token chip outside the contentEditable input. Wraps a badge config or custom render function in the correct data-astryx-tok |
| `ChatLayout` | component | `@astryxdesign/core/Chat` | `children*`, `composer*`, `emptyState`, `scrollButton`, `scrollRef` | ChatLayout is the layout shell for full-page chat interfaces. It renders messages in normal page flow and docks the composer to the bottom w |
| `ChatLayoutScrollButton` | component | `@astryxdesign/core/Chat` | `isVisible*`, `label`, `onClick*` | Floating scroll-to-bottom button that appears when the user scrolls away from the latest messages. It fades in as a compact icon button and  |
| `ChatMessage` | component | `@astryxdesign/core/Chat` | `sender*`, `children*`, `avatar`, `name`, `metadata` | Sender context wrapper: handles avatar, name, metadata, and alignment based on sender role. |
| `ChatMessageBubble` | component | `@astryxdesign/core/Chat` | `children*`, `variant`, `name`, `metadata`, `group` | Styled content container for the chat "bubble." Reads sender from parent ChatMessage context to auto-style the background. Use filled for st |
| `ChatMessageList` | component | `@astryxdesign/core/Chat` | `children*`, `emptyState`, `scrollToTopAction`, `density`, `gap` | Presentational message container with density context and infinite scroll support. Provides role="log" with aria-live="polite" for accessibi |
| `ChatMessageMetadata` | component | `@astryxdesign/core/Chat` | `timestamp`, `footer`, `status` | Place ChatMessageMetadata below a message or in the last ChatMessageBubble metadata slot to show a timestamp, footer content, and optional d |
| `ChatSendButton` | component | `@astryxdesign/core/Chat` | `isStopShown`, `isDisabled`, `onSend`, `onStop`, `sendIcon` | Use ChatSendButton as ChatComposer’s send control when the action should switch between sending and stopping. Inside ChatComposer it reads r |
| `ChatSystemMessage` | component | `@astryxdesign/core/Chat` | `children*`, `variant`, `icon`, `xstyle` | Use ChatSystemMessage for concise, non-sender content inside a chat transcript. Choose the default variant for factual status notices and th |
| `ChatTokenizedText` | component | `@astryxdesign/core/Chat` | `children*`, `tokens`, `xstyle` | Use ChatTokenizedText inside a chat message when stored plain text contains serialized token values that should be projected as inline badge |
| `CheckboxListItem` | component | `@astryxdesign/core/CheckboxList` | `label*`, `aria-label`, `value`, `description`, `endContent` | Individual checkbox item with label, description, and end content slot. Works in collection mode (inside a CheckboxList with a value array)  |
| `CollapsibleGroup` | component | `@astryxdesign/core/Collapsible` | `type`, `defaultValue`, `value`, `onChange`, `hasDividers` | Coordinates multiple Collapsible instances so only one (single mode) or any number (multiple mode) can be open at a time. Renders no wrapper |
| `CommandPaletteEmpty` | component | `@astryxdesign/core/CommandPalette` | `children*` | Empty state display for the results area. CommandPalette renders it automatically when a search returns no results, or when there is no quer |
| `CommandPaletteFooter` | component | `@astryxdesign/core/CommandPalette` | `children`, `xstyle` | CommandPalette renders CommandPaletteFooter automatically. Pass a CommandPaletteFooter to the footer slot only when replacing the default gu |
| `CommandPaletteGroup` | component | `@astryxdesign/core/CommandPalette` | `heading*`, `children*`, `xstyle` | Visual grouping with a heading label. Place inside CommandPaletteList. |
| `CommandPaletteInput` | component | `@astryxdesign/core/CommandPalette` | `placeholder`, `label`, `hasAutoFocus`, `endContent`, `value` | Use CommandPaletteInput inside CommandPalette for a popup-backed command query, or as an independent search field when no result popup is pr |
| `CommandPaletteItem` | component | `@astryxdesign/core/CommandPalette` | `value*`, `children*`, `onSelect`, `isHighlighted`, `isSelected` | Use CommandPaletteItem for one non-interactive result row inside CommandPaletteList or CommandPaletteGroup. CommandPalette owns the composit |
| `CommandPaletteList` | component | `@astryxdesign/core/CommandPalette` | `children*`, `label`, `xstyle` | Scrollable results container. Renders as a listbox standalone, and inside CommandPalette while selectable results exist. Contains CommandPal |
| `ContextMenuItem` | component | `@astryxdesign/core/ContextMenu` | `icon`, `label`, `description`, `onClick`, `href` | Menu item component for compound mode. Re-exported from DropdownMenuItem for discoverability. |
| `DialogHeader` | component | `@astryxdesign/core/Dialog` | `title`, `subtitle`, `onOpenChange`, `startContent`, `endContent` | Use DialogHeader to give a dialog a labelled title area and optional close control. |
| `DrawerHeader` | component | `@astryxdesign/core/Drawer` | `title*`, `subtitle`, `onOpenChange`, `startContent`, `endContent` | Compose DrawerHeader in the header slot of a Layout inside the Drawer, as DialogHeader is composed in Dialog, for a title row and, when you  |
| `DropdownMenuCheckboxItem` | component | `@astryxdesign/core/DropdownMenu` | `label`, `description`, `icon`, `value`, `onChange` | An independently checkable option inside DropdownMenu. The row owns menuitemcheckbox semantics while the shared Indicator supplies decorativ |
| `DropdownMenuDivider` | component | `@astryxdesign/core/DropdownMenu` | `xstyle` | A horizontal rule separating groups of rows in a compound menu. Renders role="separator", so it is never a stop in the arrow-key order. The  |
| `DropdownMenuGroup` | component | `@astryxdesign/core/DropdownMenu` | `title`, `children`, `xstyle`, `className`, `style` | Use DropdownMenuGroup to give related compound-menu rows one visible and programmatic name. Use an untitled group only when a separate name  |
| `DropdownMenuItem` | component | `@astryxdesign/core/DropdownMenu` | `icon`, `label*`, `description`, `onClick`, `href` | Use DropdownMenuItem inside DropdownMenu compound mode for one action or destination. Keep label, description, icon, and endContent non-inte |
| `DropdownMenuRadioGroup` | component | `@astryxdesign/core/DropdownMenu` | `value*`, `onChange*`, `label*`, `hasCloseOnSelect`, `ref` | Use DropdownMenuRadioGroup inside compound-mode DropdownMenu when several commands represent one mutually exclusive choice. Keep value in ca |
| `DropdownMenuRadioItem` | component | `@astryxdesign/core/DropdownMenu` | `value*`, `label*`, `description`, `icon`, `isDisabled` | A single option in a DropdownMenuRadioGroup (role="menuitemradio"). Must be used inside a DropdownMenuRadioGroup. |
| `DropdownMenuSubMenu` | component | `@astryxdesign/core/DropdownMenu` | `label*`, `icon`, `description`, `children*`, `isDisabled` | A single menu row that reveals a nested flyout of its own items. The row adopts DropdownMenuItem semantics (label / icon / description / isD |
| `FieldLabel` | component | `@astryxdesign/core/Field` | `label*`, `inputID*`, `labelID`, `isGroupLabel`, `isLabelHidden` | Standalone label group for one control or a caller-labelled group, with optional supporting text, optionality indicators, icon, and tooltip. |
| `GridSpan` | component | `@astryxdesign/core/Grid` | `columns`, `rows`, `children`, `xstyle`, `className` | Grid item that spans multiple columns or rows. |
| `Heading` | component | `@astryxdesign/core/Text` | `level*`, `type`, `weight`, `children*`, `accessibilityLevel` | Semantic heading component that renders h1-h6 elements with themed styling, themed sizing via type scale tokens, and line-clamp truncation. |
| `InputGroupText` | component | `@astryxdesign/core/InputGroup` | `children*`, `xstyle`, `className`, `style`, `ref` | Use InputGroupText inside InputGroup for a short fixed prefix or suffix, such as a currency symbol, a protocol, or a unit, or for a decorati |
| `LayoutContent` | component | `@astryxdesign/core/Layout` | `children`, `padding`, `isScrollable`, `label`, `role` | Scrollable main content area. |
| `LayoutFooter` | component | `@astryxdesign/core/Layout` | `children`, `hasDivider`, `height`, `label`, `padding` | Bottom bar for action bars, pagination, and status bars. |
| `LayoutHeader` | component | `@astryxdesign/core/Layout` | `children`, `hasDivider`, `height`, `label`, `padding` | Top bar for page titles, app bars, and toolbars. |
| `LayoutPanel` | component | `@astryxdesign/core/Layout` | `children`, `hasDivider`, `padding`, `isScrollable`, `label` | Sidebar for navigation, settings, or inspector panels. |
| `ListItem` | component | `@astryxdesign/core/List` | `label*`, `description`, `startContent`, `endContent`, `onClick` | List item with label, description, start/end content slots, and interactive patterns. |
| `MetadataListItem` | component | `@astryxdesign/core/MetadataList` | `children*`, `label*`, `icon`, `xstyle`, `className` | A single labeled metadata value within a MetadataList. |
| `RadioListItem` | component | `@astryxdesign/core/RadioList` | `label*`, `aria-label`, `value*`, `description`, `align` | Individual radio item with label, description, and content slots. Under a coarse pointer an enabled option’s target grows toward 44 px throu |
| `SegmentedControlItem` | component | `@astryxdesign/core/SegmentedControl` | `value*`, `label*`, `isLabelHidden`, `icon`, `isDisabled` | Individual segment item rendering as a radio button within the segmented control. |
| `SelectorOption` | component | `@astryxdesign/core/Selector` | `label*`, `icon`, `description`, `layout`, `endContent` | Helper component for custom item rendering inside an Selector renderOption prop. |
| `SideNavCollapseButton` | component | `@astryxdesign/core/SideNav` | `collapsible`, `handleRef`, `label`, `size`, `children` | Toggle button for sidenav collapse. Place inside SideNav (reads context automatically) or outside it (hand the same controlled collapsible c |
| `SideNavHeading` | component | `@astryxdesign/core/SideNav` | `heading*`, `icon`, `headingHref`, `superheading`, `superheadingHref` | Product/suite/account heading with smart interaction boundary logic for links and a menu popover. |
| `SideNavItem` | component | `@astryxdesign/core/SideNav` | `label*`, `as`, `icon`, `selectedIcon`, `isSelected` | Navigation item with icon, selected state, optional end content, and nesting support via children. |
| `SideNavSection` | component | `@astryxdesign/core/SideNav` | `title*`, `subtitle`, `children`, `endContent`, `isHeaderHidden` | Section grouping with an optional title, subtitle, and end content. |
| `Tab` | component | `@astryxdesign/core/TabList` | `value*`, `label*`, `isLabelHidden`, `href`, `panelId` | Individual tab item that renders as a button or an anchor link, with selected-state styling and optional icons. |
| `TableBody` | component | `@astryxdesign/core/Table` | `children*`, `xstyle` | <tbody> wrapper for children mode. Holds the data rows. A row must sit inside a section: <table> cannot contain a <tr> directly, because the |
| `TableCell` | component | `@astryxdesign/core/Table` | `children` | <td> wrapper that reads TableContext to apply density padding, font size, and divider borders when used inside Table. |
| `TableFooter` | component | `@astryxdesign/core/Table` | `children*`, `xstyle` | <tfoot> wrapper for children mode. Holds summary or total rows beneath the body. A row must sit inside a section: <table> cannot contain a < |
| `TableHeader` | component | `@astryxdesign/core/Table` | `children*`, `xstyle` | <thead> wrapper for children mode. Holds the header row, whose cells are TableHeaderCell. A row must sit inside a section: <table> cannot co |
| `TableHeaderCell` | component | `@astryxdesign/core/Table` | `children` | <th> wrapper that reads TableContext to apply density padding, semibold weight, secondary text color, and divider borders when used inside T |
| `TableRow` | component | `@astryxdesign/core/Table` | `children*` | <tr> wrapper that reads TableContext to apply striped, hover, and divider styles when used inside Table. |
| `TableSelectionToolbar` | component | `@astryxdesign/core/Table` | `selection*`, `startContent`, `label`, `renderSelectionLabel`, `clearLabel` | Pass both outputs of useTableSelectionState to their matching consumers: selectionConfig to useTableSelection and selectionState to TableSel |
| `TabMenu` | component | `@astryxdesign/core/TabList` | `label*`, `options*` | Overflow menu trigger that opens a dropdown of additional tab options, showing the selected option's label as the trigger text. Host attribu |
| `ToggleButtonGroup` | component | `@astryxdesign/core/ToggleButton` | `children*`, `label*`, `type`, `value*`, `onChange*` | Groups toggle buttons for exclusive (single) or multi-select behavior. Uses discriminated union on type for type-safe value/onChange. Under  |
| `TopNavHeading` | component | `@astryxdesign/core/TopNav` | `logo`, `heading`, `headingHref`, `superheading`, `superheadingHref` | Product/suite/account heading for the TopNav heading slot. Supports smart interaction boundary logic: logo, heading text, superheading/subhe |
| `TopNavItem` | component | `@astryxdesign/core/TopNav` | `label*`, `href`, `isSelected`, `isDisabled`, `isIconOnly` | Navigation link item for use in TopNav startContent: renders as an anchor with hover and selected states. |
| `TopNavMegaMenu` | component | `@astryxdesign/core/TopNav` | `label*`, `items`, `featured`, `delay`, `hideDelay` | Navigation item that displays a full-width mega menu panel on hover. Uses a slots API with items and featured props. TopNavMegaMenuItem rend |
| `TopNavMegaMenuFeaturedCard` | component | `@astryxdesign/core/TopNav` | `title*`, `description`, `image`, `imageAlt`, `linkLabel` | Standard featured card for the TopNavMegaMenu featured slot. Provides a consistent card with optional image, title, description, and CTA lin |
| `TopNavMegaMenuItem` | component | `@astryxdesign/core/TopNav` | `title*`, `description`, `icon`, `href`, `onClick` | An individual item inside an TopNavMegaMenu. Renders itself in both desktop (popover grid) and mobile drawer modes via render mode context. |
| `TopNavMenu` | component | `@astryxdesign/core/TopNav` | `label*`, `items*`, `delay`, `hideDelay` | Navigation item that displays a hover-triggered popover menu with rich items containing an icon, title, and optional description. |
| `TypeaheadItem` | component | `@astryxdesign/core/Typeahead` | `item*`, `icon`, `description`, `isDisabled`, `group` | Default dropdown item renderer for typeahead results. Shows label with optional icon, description, and avatar. Exported for use in custom re |

## Hooks (87)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `useAnimatedLayout` | hook | `@astryxdesign/core` | — | Returns a handle to pass to a component whose size changes, such as TreeList or Collapsible. When that component changes size, it and the co |
| `useAnimator` | hook | `@astryxdesign/core` | — | Animates one element with the motion Astryx's own components use. Call `animator.animate` to spring an element to new values on the state-ch |
| `useAnnounce` | hook | `@astryxdesign/core` | — | Imperatively announces a message to screen readers through a visually-hidden live region. Use it for state that is only conveyed visually; s |
| `useAppShellMobile` | hook | `@astryxdesign/core/AppShell` | — | Hook for reading and controlling AppShell mobile navigation state from descendants of AppShell. Use it for custom mobile nav triggers, closi |
| `useCalendarConstraints` | hook | `@astryxdesign/core/Calendar` | — | Provides date constraint validation for calendar views and custom range pickers. It combines boundary dates, span limits measured from an in |
| `useCalendarDays` | hook | `@astryxdesign/core/Calendar` | — | Builds the day grid for one month: every date to show, including the previous and next months' days that fill the first and last weeks, grou |
| `useCalendarNavigation` | hook | `@astryxdesign/core/Calendar` | — | Manages visible month state and pagination for calendar components. It provides previous/next month stepping, localized month-year header st |
| `useChatDictation` | hook | `@astryxdesign/core/Chat` | — | Voice input for a chat composer. It wraps speech recognition with microphone level, start and stop cues, and optional interim text in a Chat |
| `useChatPasteAsToken` | hook | `@astryxdesign/core/Chat` | — | Turns a long plain-text paste into a token chip in a ChatComposerInput. Short pastes are left for the composer to insert. Pass the returned  |
| `useClickableContainer` | hook | `@astryxdesign/core` | — | Makes a container element clickable while preserving nested interactive element behavior. Solves the "nested interactive elements" problem:  |
| `useClipboard` | hook | `@astryxdesign/core` | — | Copy-to-clipboard behavior: the clipboard write, a transient isCopied flag with its own reset timer, and an optional polite screen-reader an |
| `useCollapsible` | hook | `@astryxdesign/core/Collapsible` | — | Reusable hook that encapsulates the collapsible state machine. Supports three modes: group-controlled (inside CollapsibleGroup), controlled  |
| `useCollator` | hook | `@astryxdesign/core/i18n` | — | Returns the sanctioned locale-aware comparator for custom sorting. The collator is recreated when the provider locale or an option changes. |
| `useCombobox` | hook | `@astryxdesign/core/Selector` | — | Tracks the active option of a single-select combobox and handles its keys, while DOM focus stays on the control. It powers Selector and Comm |
| `useContainerReveal` | hook | `@astryxdesign/core` | — | A headless hover/focus reveal primitive. Gives a container a scoped trigger that reveals (or conceals) content inside it when the container  |
| `useDevWarning` | hook | `@astryxdesign/core` | — | Fires a dev-only "Component: message" console warning once per mount while the condition holds. It is the render-safe way for a component to |
| `useDirection` | hook | `@astryxdesign/core/i18n` | — | Reads the current text direction during render. Reach for this hook as a last resort when render-time direction is strictly required (such a |
| `useDragToSnapPoints` | hook | `@astryxdesign/core` | — | Lets a drag move an element along one axis and settles it on snap points when the finger lifts, the way an iOS sheet settles on its detents: |
| `useEntryAnimation` | hook | `@astryxdesign/core` | — | Returns a StyleX style for animating an element on mount. Only animates when the element is dynamically inserted after the initial page pain |
| `useFocusTrap` | hook | `@astryxdesign/core` | — | Traps focus within a container element following the WAI-ARIA dialog focus trap pattern. Listens to focus events on the document and redirec |
| `useGridFocus` | hook | `@astryxdesign/core` | — | Manages keyboard navigation within a 2D grid following the WAI-ARIA grid pattern. Supports arrow keys for cell-to-cell navigation, Home/End  |
| `useHotkeys` | hook | `@astryxdesign/core` | — | Registers global keyboard shortcuts with a single window keydown listener per hook instance. Handlers live in a ref, so re-renders never re- |
| `useHoverCard` | hook | `@astryxdesign/core/HoverCard` | — | Headless hook for hover-triggered floating cards. Builds on useLayer with hover/focus intent detection, configurable delays, safe hover beha |
| `useIcon` | hook | `@astryxdesign/core/Icon` | — | Resolves a built-in meaning to a React node through the nearest Theme, so a custom component draws the same success, warning or error icon t |
| `useImageMode` | hook | `@astryxdesign/core` | — | Detects whether an image is predominantly dark or light by sampling pixels via OffscreenCanvas. Uses APCA perceptual lightness (sRGB lineari |
| `useImperativeAlertDialog` | hook | `@astryxdesign/core/AlertDialog` | `show`, `hide`, `isOpen`, `element` | Hook for showing an alert dialog without managing open state. Call alert.show(options) to open and alert.hide() to close. Render alert.eleme |
| `useImperativeDialog` | hook | `@astryxdesign/core/Dialog` | `show`, `hide`, `isOpen`, `element` | Hook for showing a dialog without managing open state. Call dialog.show(content, options) to open and dialog.hide() to close. Render dialog. |
| `useIndicatorFocusRing` | hook | `@astryxdesign/core` | — | Draws the standard focus ring on the indicator of a control whose real input is visually hidden; a checkbox or radio focuses an opacity-0 in |
| `useInputContainer` | hook | `@astryxdesign/core` | — | Makes an input container wrapper clickable, delegating focus to the inner input/textarea when the user clicks non-interactive areas (icons,  |
| `useInputStatusIcon` | hook | `@astryxdesign/core` | — | Builds the on-field status affordance for a bordered input and its accessibility wiring, so every input in the family behaves the same for a |
| `useInteractiveRole` | hook | `@astryxdesign/core` | — | Resolves what a polymorphic component should render as, in one place: href wins, then onClick, then an interactive trigger context supplied  |
| `useKeyboardHint` | hook | `@astryxdesign/core` | — | Shows an ephemeral "← → to navigate" hint anchored to the focused item the first time a roving-tabindex composite (Toolbar, TabList, Segment |
| `useLayer` | hook | `@astryxdesign/core/Layer` | — | Core positioning hook for rendering overlay content using CSS Anchor Positioning and the Popover API. Use it as the foundation for custom po |
| `useLightbox` | hook | `@astryxdesign/core/Lightbox` | — | State management and accessible trigger wiring for Lightbox. Eliminates boilerplate for managing open state and current index. Returns trigg |
| `useLinkComponent` | hook | `@astryxdesign/core/Link` | — | Resolves which component renders a link, so a custom component's links follow the app's router the same way Astryx's own links do. The order |
| `useLinkify` | hook | `@astryxdesign/core/Link` | — | Finds URLs, email addresses and custom patterns in plain text and returns React nodes with a Link for each match; the links respect LinkProv |
| `useListFocus` | hook | `@astryxdesign/core` | — | Manages keyboard navigation within a linear list following WAI-ARIA menu/listbox/toolbar patterns. Supports arrow key navigation (vertical,  |
| `useLocale` | hook | `@astryxdesign/core/i18n` | — | Reads the authoritative Astryx locale. Use it to thread the provider locale into pure formatting helpers and sibling-package APIs; do not de |
| `useLongPress` | hook | `@astryxdesign/core` | — | Detects a single-finger press-and-hold and reports where it happened, so touch users can reach affordances that a pointer gets from right-cl |
| `useMediaQuery` | hook | `@astryxdesign/core` | — | SSR-safe media query hook that subscribes to window.matchMedia changes. Returns whether the given media query matches. Always returns false  |
| `useMenuPress` | hook | `@astryxdesign/core` | — | The press model of macOS and iOS menus, for any pointer: the row under the pointer when it is RELEASED is the row that acts, the highlight f |
| `useMergedRefs` | hook | `@astryxdesign/core` | — | Combines multiple object or callback refs into one stable callback ref. Use it when a component must forward a consumer ref while also attac |
| `useMultiCombobox` | hook | `@astryxdesign/core/MultiSelector` | — | Tracks the active option of a multi-select combobox and handles its keys, while DOM focus stays on the control. It powers MultiSelector; unl |
| `useOutlineFromDOM` | hook | `@astryxdesign/core/Outline` | — | Builds outline items from the headings already in the page. Use it when the article is not a Markdown string, and pass the items to Outline. |
| `useOutlineFromMarkdown` | hook | `@astryxdesign/core/Outline` | — | Extracts the headings of a Markdown string for an Outline next to the rendered document. It uses the parser and heading slugs that Markdown  |
| `useOverflow` | hook | `@astryxdesign/core` | — | Measures children rendered in a hidden container to determine how many fit in the available width without flickering. Uses ResizeObserver to |
| `useOverlay` | hook | `@astryxdesign/core/Overlay` | — | Adds overlay behavior to a container you already render, such as a Card or a custom media frame, without the wrapper Overlay adds. Spread co |
| `usePanGesture` | hook | `@astryxdesign/core` | — | Reports a drag on an element as values, for a surface the product moves itself: a card that follows the finger, a drawer pulled by its handl |
| `usePopover` | hook | `@astryxdesign/core/Popover` | — | Headless hook for click-triggered popovers with focus trapping. Combines useLayer with useFocusTrap, auto-focus, light dismiss, Escape handl |
| `usePowerSearchConfig` | hook | `@astryxdesign/core/PowerSearch` | — | Memoizes a PowerSearch configuration built from typed field definitions and returns it along with an applyFilters function for client-side f |
| `usePressFeedback` | hook | `@astryxdesign/core` | — | The touch press model every Astryx pressable uses, for a local component that paints its own press. Under a finger, CSS `:active` paints on  |
| `useResizable` | hook | `@astryxdesign/core/Resizable` | — | Hook for adding drag-to-resize behavior to layout regions. Supports single-region and multi-region configurations with snap points, collapsi |
| `useScrollableArea` | hook | `@astryxdesign/core` | — | Adds canonical axis-aware scroll behavior to structure owned by the caller. An axis is effective only when its computed overflow is scroll-c |
| `useScrollLock` | hook | `@astryxdesign/core` | — | Locks page scroll while active and keeps the page where it is. The page gets overflow: hidden (on the root, or on body when its own overflow |
| `useScrollOverflow` | hook | `@astryxdesign/core` | — | Tracks scroll overflow state for a horizontally scrollable container. Returns a ref callback and state booleans that update as the user scro |
| `useSnapPaging` | hook | `@astryxdesign/core/SnapPaging` | — | Gives a Carousel iOS paging on native snap's stops: pass the value as hasSnap={useSnapPaging()}. Under a finger and on a trackpad swipe, a f |
| `useSpeechRecognition` | hook | `@astryxdesign/core/Chat` | — | A headless speech-recognition control. It does not write into a composer. Read the transcript from interimTranscript and onResult, and draw  |
| `useStreamingText` | hook | `@astryxdesign/core` | — | Smooths bursty streamed text into a steady character-by-character reveal using requestAnimationFrame. Decouples arrival rate from display ra |
| `useSyntaxTheme` | hook | `@astryxdesign/core/theme` | — | Reads syntax colors for a canvas or other drawing that cannot use the CSS variables SyntaxTheme sets. Call it under a SyntaxTheme. It return |
| `useTableColumnResize` | hook | `@astryxdesign/core/Table` | `columnWidths`, `onColumnResizeEnd`, `minWidth`, `maxWidth`, `columns` | Hook that returns a TablePlugin adding draggable resize handles to column header borders. T is the row type; TypeScript cannot infer it from |
| `useTableColumnSettings` | hook | `@astryxdesign/core/Table` | `columns*`, `activeColumnKeys*`, `onChangeActiveColumnKeys*`, `defaultColumnKeys` | Headless column visibility and ordering management for Table. T is the row type; TypeScript cannot infer it from the config, so it defaults  |
| `useTableColumnSettingsState` | hook | `@astryxdesign/core/Table` | — | Headless column visibility and ordering state management for Table. Manages which columns are active, provides toggle and reset operations,  |
| `useTableColumnsVirtualization` | hook | `@astryxdesign/core/Table` | `initialViewportWidth*` | Returns an opaque capability for Table column windowing. Pass the capability to Table.virtualization and keep the complete data, columns, ex |
| `useTableFiltering` | hook | `@astryxdesign/core/Table` | `filters*`, `onFilterChange*`, `variant`, `searchConfig*` | Table plugin that adds inline column filters with popover or inline controls. T is the row type; TypeScript cannot infer it from the config, |
| `useTableFilterState` | hook | `@astryxdesign/core/Table` | `initialState` | Managed state hook for table filtering. Returns filters (the current filter map), onFilterChange, and clearAll (clears every filter, for exa |
| `useTableGroupedRows` | hook | `@astryxdesign/core/Table` | `data*`, `groupBy*`, `collapsedGroups*`, `onToggleGroup*`, `renderGroupHeader` | Hook that groups a flat data array into collapsible section rows. Each distinct groupBy value becomes a full-width section-header row with a |
| `useTableInfiniteScroll` | hook | `@astryxdesign/core/Table` | `hasMore*`, `isLoading*`, `onLoadMore*` | Call useTableInfiniteScroll<T>({hasMore, isLoading, onLoadMore}) and pass the result to <Table plugins={{infiniteScroll: plugin}} />. T is t |
| `useTablePagination` | hook | `@astryxdesign/core/Table` | `page*`, `onPageChange*`, `totalItems`, `totalPages`, `hasMore` | Call useTablePagination with a config object containing page state and callback. T is the row type; TypeScript cannot infer it from the conf |
| `useTableRowExpansion` | hook | `@astryxdesign/core/Table` | `expandedKeys*`, `onToggle*`, `getRowKey*`, `getRowLabel`, `renderExpanded*` | Hook that returns a TablePlugin which expands a full-width detail panel below a row, rendered by the consumer via renderExpanded(item). Adds |
| `useTableRowIndex` | hook | `@astryxdesign/core/Table` | `data`, `getRowKey`, `label`, `startFrom` | Hook that returns a TablePlugin which prepends a right-aligned, monospaced row-number column, starting at 1 by default. Without data, Table  |
| `useTableRowStatus` | hook | `@astryxdesign/core/Table` | `getStatus*` | Hook that returns a TablePlugin which prepends a narrow column signaling per-row status. Return {status, label} for a semantic success, warn |
| `useTableRowsVirtualization` | hook | `@astryxdesign/core/Table` | `rowHeight*`, `initialViewportHeight*` | Returns an opaque capability for fixed-height flat-row Table windowing. Pass the capability to Table.virtualization and keep the complete da |
| `useTableSelection` | hook | `@astryxdesign/core/Table` | `getIsItemSelected*`, `onSelectItem*`, `onSelectAll*`, `getIsAllSelected*`, `getIsIndeterminate` | Hook that returns a TablePlugin implementing row selection with checkboxes, select-all, and aria-selected. Uses React Context for independen |
| `useTableSelectionState` | hook | `@astryxdesign/core/Table` | `data*`, `idKey*`, `selectedKeys*`, `setSelectedKeys*`, `getIsItemSelectable` | State management companion for useTableSelection that returns {selectionConfig, selectionState}: selectionConfig (UseTableSelectionConfig<T> |
| `useTableSortable` | hook | `@astryxdesign/core/Table` | `sort*`, `onSortChange*`, `allowUnsortedState`, `isMultiSortEnabled` | useTableSortable adds the header sort controls but does not reorder the rows: pass rows that are already sorted as data, sorted by you from  |
| `useTableSortableState` | hook | `@astryxdesign/core/Table` | — | Owns a Table's sort state and sorts the rows locally, as a convenience layer over useTableSortable. Pass the rows in, render sortedData, and |
| `useTableStickyColumns` | hook | `@astryxdesign/core/Table` | `startKeys`, `endKeys` | Hook that returns a TablePlugin which pins a contiguous run of columns to the start and/or end edge of the table. T is the row type; TypeScr |
| `useTableTreeData` | hook | `@astryxdesign/core/Table` | `getRowMeta*`, `onToggleItem*`, `getRowLabel`, `hasExpandableRows*`, `hasExpandAllControl` | Headless tree plugin for Table: renders nested rows with per-level indentation and expand/collapse chevrons in the tree column (the first co |
| `useTableTreeState` | hook | `@astryxdesign/core/Table` | `data*`, `idKey*`, `childrenKey`, `defaultExpandedIds`, `expandedIds` | State management companion for useTableTreeData. Owns the expanded set (controlled or uncontrolled) and flattens nested data into the visibl |
| `useTheme` | hook | `@astryxdesign/core/theme` | — | Programmatic access to theme tokens for non-CSS consumers like SVG, canvas, Vega, D3, maps, or chart libraries that need values in JavaScrip |
| `useThemeName` | hook | `@astryxdesign/core/theme` | — | Reads only the active theme name. Use it when code needs to know which theme is on, and does not need tokens or the color mode. It reads The |
| `useToast` | hook | `@astryxdesign/core/Toast` | — | Hook for showing toast notifications from anywhere in your component tree; it needs no provider or mounted ToastViewport: inside LayerProvid |
| `useTooltip` | hook | `@astryxdesign/core/Tooltip` | — | Headless hook for hover/focus-triggered tooltips. Builds on useLayer with hover intent, keyboard focus handling, and accessible aria-describ |
| `useTranslator` | hook | `@astryxdesign/core/i18n` | — | Returns a translator function that resolves keys against the current locale, provider overrides, and the shipped English fallback catalog. C |
| `useTreeFocus` | hook | `@astryxdesign/core` | — | Manages roving-tabindex focus and the WAI-ARIA tree keyboard model. ArrowUp/ArrowDown/Home/End roam linearly over the visible treeitems (ski |
| `useTruncation` | hook | `@astryxdesign/core/Text` | — | Detects whether an element's text is cut off — single-line overflow or clamped to several lines — and gives back the full text, updating whe |
| `useTypeahead` | hook | `@astryxdesign/core` | — | Adds APG type-to-focus search to a collection: printable keystrokes are buffered (resetting after a pause), and the first item whose label s |

## Layout (11)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `AppShell` | component | `@astryxdesign/core/AppShell` | `children`, `contentPadding`, `topNav`, `sideNav`, `mobileNav` | AppShell is the page shell for an application. It provides slots for top navigation, side navigation, banners, and main content. Use it as t |
| `AspectRatio` | component | `@astryxdesign/core/AspectRatio` | `ratio*`, `shape`, `fit`, `children*`, `xstyle` | Maintains a fixed width-to-height ratio for its children as its container resizes. Use it for media containers like videos, images, thumbnai |
| `Center` | component | `@astryxdesign/core/Center` | `axis`, `width`, `height`, `maxWidth`, `minHeight` | Center aligns content to the middle of its container. Use it for empty states, loading screens, login forms, or any content that should sit  |
| `Divider` | component | `@astryxdesign/core/Divider` | `orientation`, `label`, `variant`, `isFullBleed`, `xstyle` | A visual separator that divides content into distinct sections. Use to create clear boundaries between groups of related content, or to dema |
| `FormLayout` | component | `@astryxdesign/core/FormLayout` | `direction`, `defaultOptionality`, `defaultEntryErrorBehavior`, `children`, `xstyle` | A layout container that arranges form fields with consistent spacing and direction. FormLayout handles where fields go, not state or submiss |
| `Grid` | component | `@astryxdesign/core/Grid` | `columns`, `width`, `height`, `maxWidth`, `minHeight` | A CSS grid layout container for arranging children in rows and columns. Use Grid for card galleries, dashboards, and any multi-column layout |
| `Layout` | component | `@astryxdesign/core/Layout` | `content`, `header`, `footer`, `start`, `end` | Layout is a general five-slot primitive for arranging header, start, content, end, and footer regions within a page or bounded container. Ap |
| `Resizable` | component | `@astryxdesign/core/Resizable` | — | Hook-based resizable panel system. useResizable() manages size state and ResizeHandle provides the interactive pill-grip separator. Pass the |
| `ScrollableArea` | component | `@astryxdesign/core/ScrollableArea` | `axis`, `label*`, `role`, `overscroll`, `width` | Provides a native scroll viewport and a real observed content box. The viewport enters the tab order only while a requested logical axis is  |
| `Section` | component | `@astryxdesign/core/Section` | `variant`, `width`, `height`, `maxWidth`, `minHeight` | Section is the correct way to create page regions and group related content on a page. Use it for settings groups, form sections, sidebar ar |
| `Stack` | component | `@astryxdesign/core/Stack` | — | Stack arranges items in a row or column with consistent spacing. Use the gap prop to control the space between items. |

## Navigation (11)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Breadcrumbs` | component | `@astryxdesign/core/Breadcrumbs` | `children*`, `separator`, `variant`, `label`, `xstyle` | Breadcrumbs show a trail of links from the root to the current page. Use them at the top of detail pages, settings panels, or anywhere the u |
| `MobileNav` | component | `@astryxdesign/core/MobileNav` | — | A slide-out drawer for mobile navigation. MobileNav is the mobile counterpart to SideNav and accepts the same children. Use it on narrow vie |
| `NavHeadingMenu` | component | `@astryxdesign/core/NavMenu` | `children*`, `size`, `minWidth`, `ref`, `xstyle` | Accessible menu container and items for nav heading popovers. NavHeadingMenu provides role="menu" with keyboard navigation; NavHeadingMenuIt |
| `NavIcon` | component | `@astryxdesign/core/NavIcon` | `icon*` | NavIcon is a circular icon container with an accent-colored background. Use it in navigation headers such as TopNavHeading and SideNavHeadin |
| `Outline` | component | `@astryxdesign/core/Outline` | — | A table-of-contents sidebar for documentation pages, help centers, wikis, and long settings pages. Use it for navigation within a single pag |
| `Pagination` | component | `@astryxdesign/core/Pagination` | `page*`, `onChange*`, `changeAction`, `getPageHref`, `as` | Pagination lets users step through pages of content. Place it below a table, list, or card grid so users can move forward and backward throu |
| `SideNav` | component | `@astryxdesign/core/SideNav` | `header`, `topContent`, `children`, `footer`, `footerIcons` | A sidebar navigation component for organizing application pages with sections, nested items, and icons. Use SideNav as the primary navigatio |
| `Step` | component | `@astryxdesign/core/Stepper` | `step*`, `label*`, `description`, `children`, `status` | Individual step within a Stepper. Renders a progress-bar segment, an indicator, and a label with optional description. Progress (completed/a |
| `Stepper` | component | `@astryxdesign/core/Stepper` | — | Steppers display progress through a sequence of logical and numbered steps. Use them for multi-step workflows like forms, onboarding flows,  |
| `TabList` | component | `@astryxdesign/core/TabList` | `value*`, `onChange*`, `size`, `layout`, `hasDivider` | TabList provides tab-style navigation for organizing content into categorized sections. Use it to let users switch between related views wit |
| `TopNav` | component | `@astryxdesign/core/TopNav` | `heading`, `startContent`, `children`, `centerContent`, `endContent` | TopNav is a horizontal navigation bar for product-level navigation in application headers. Use TopNav for 5 or fewer always-visible navigati |

## Overlay (12)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `AlertDialog` | component | `@astryxdesign/core/AlertDialog` | `isOpen*`, `onOpenChange*`, `title*`, `description*`, `actionLabel*` | AlertDialog asks the user to confirm a destructive or irreversible action before it happens. Use it for things like deleting content, revoki |
| `BottomSheet` | component | `@astryxdesign/core/BottomSheet` | `isOpen`, `onOpenChange`, `finalFocusRef`, `purpose`, `sheetId` | A mobile touch surface for filters, actions, forms, and detail views that should rise from the bottom of the viewport. For a multi-step flow |
| `BottomSheetSwitcher` | component | `@astryxdesign/core/BottomSheet` | `ref`, `onCancel`, `activeSheet*`, `onActiveSheetChange*`, `hasScrim` | Deprecated: write each step as its own BottomSheet with isOpen, controlled by one state value that names the open step. Closing the top shee |
| `CommandPalette` | component | `@astryxdesign/core/CommandPalette` | `isOpen*`, `onOpenChange*`, `searchSource*`, `input`, `footer` | CommandPalette is a searchable dialog for quick access to commands, navigation, and actions. Use it as a keyboard-driven launcher powered by |
| `Dialog` | component | `@astryxdesign/core/Dialog` | `isOpen*`, `onOpenChange*`, `children*`, `width`, `maxHeight` | Dialog displays a modal overlay that blocks interaction with the page until the user responds. Use it for delete confirmations, edit forms,  |
| `Drawer` | component | `@astryxdesign/core/Drawer` | `isOpen*`, `onOpenChange*`, `label*`, `children*`, `side` | A side panel that floats above page content for inspectors and detail views: the "click a table row, see its details" pattern. Unlike a dock |
| `HoverCard` | component | `@astryxdesign/core/HoverCard` | — | HoverCard shows additional information when the user hovers or focuses a trigger element. Use it for profile cards, link summaries, or inlin |
| `Lightbox` | component | `@astryxdesign/core/Lightbox` | `isOpen*`, `onOpenChange*`, `media*`, `index`, `onIndexChange` | A fullscreen overlay for viewing images and videos at full resolution. Supports single-item and gallery modes with prev/next navigation and  |
| `Overlay` | component | `@astryxdesign/core/Overlay` | `content*`, `children`, `showOn`, `isOpen`, `scrim` | Overlay layers action or supporting content over media, cards, video, or other bounded surfaces with an optional scrim and reveal behavior.  |
| `Popover` | component | `@astryxdesign/core/Popover` | — | A click-triggered overlay anchored to a button or trigger element. Use it for secondary actions, inline confirmations, or supplementary info |
| `Toast` | component | `@astryxdesign/core/Toast` | `body*`, `type`, `isAutoHide*`, `autoHideDuration*`, `isExiting` | Toast shows a brief, non-blocking notification to confirm an action or present temporary information; show one with `const showToast = useTo |
| `Tooltip` | component | `@astryxdesign/core/Tooltip` | — | A short text hint that appears on hover or focus, anchored to a trigger element. Use it to describe icon-only buttons, show the full text of |

## Table & List (6)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `Item` | component | `@astryxdesign/core/Item` | — | A single, flexible item primitive that unifies the "start content + label + description + end content" pattern across Astryx. Use it whereve |
| `List` | component | `@astryxdesign/core/List` | `children`, `density`, `hasDividers`, `animatedLayout`, `reorderable` | A vertical collection of items with consistent spacing, dividers, and optional markers. Supports headers, icons, avatars, badges, and intera |
| `MetadataList` | component | `@astryxdesign/core/MetadataList` | `children*`, `columns`, `label`, `maxNumOfItems`, `orientation` | MetadataList displays key-value pairs for object attributes like quality, condition, and status, in a structured layout. Use it for detail p |
| `OverflowList` | component | `@astryxdesign/core/OverflowList` | `children*`, `overflowRenderer`, `onOverflowChange`, `gap`, `minVisibleItems` | A horizontal list that automatically hides items when they exceed the available width. Use OverflowList for breadcrumbs, toolbars, tag lists |
| `Table` | component | `@astryxdesign/core/Table` | `data`, `columns`, `idKey`, `density`, `dividers` | Table displays structured data in rows and columns with consistent dimensionality. It supports rich cell content, sorting, selection, pagina |
| `TreeList` | component | `@astryxdesign/core/TreeList` | — | An expandable tree structure for displaying hierarchical data with branch connector lines. Use it for file explorers, nested category browse |

## Utility (7)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `InternationalizationProvider` | utility | `@astryxdesign/core/i18n` | `locale*`, `messages`, `overrides`, `dir`, `calendar` | Wraps your app to set the active locale and (optionally) merge additional translation catalogs + per-locale overrides. Astryx components ins |
| `Layer` | component | `@astryxdesign/core/Layer` | — | Layer utilities provide the app-level provider used by overlay systems. Use LayerProvider at the app root for toast/layer configuration; use |
| `LinkProvider` | component | `@astryxdesign/core/Link` | `component*`, `children*` | Wraps your app to replace the default <a> tag with a framework-specific link component (e.g. Next.js Link) for client-side routing across al |
| `MediaTheme` | utility | `@astryxdesign/core/theme` | `mode*`, `fallback`, `children*` | Provides token overrides for content rendered on inverted surfaces: media overlays, scrims, toasts, and tooltips. The base behavior flips co |
| `SyntaxTheme` | utility | `@astryxdesign/core/theme` | `theme*`, `children*` | Applies syntax highlighting colors to CodeBlock and any code component in the subtree. By default, code components use the theme-level synta |
| `Theme` | utility | `@astryxdesign/core/theme` | `theme*`, `mode`, `children*` | Wraps a subtree with a specific Astryx theme. For static production themes, use `astryx theme build` and import the generated CSS plus built |
| `VisuallyHidden` | component | `@astryxdesign/core/VisuallyHidden` | `children`, `as` | Renders content in the accessibility tree while hiding it visually. Use for accessible names on icon-only controls, aria-live announcement r |

## interaction (3)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `createDragToSnapPoints` | utility | `@astryxdesign/core/dragToSnapPoints` | — | Lets a drag move an element along one axis and settles it on snap points when the finger lifts, the way an iOS sheet settles on its detents: |
| `createReorderable` | utility | `@astryxdesign/core/reorderable` | — | Makes a collection's rows reorderable. On a touch screen a finger held still on a row's handle for a moment picks it up (a flick on the hand |
| `createSwipe` | utility | `@astryxdesign/core/Swipe` | — | Gives a list row the verbs a sideways swipe uncovers, the way a mail row reveals Archive and Delete on a phone: `const mail = createSwipe({t |

## motion & gestures (2)

| Name | Kind | Import | Key Props | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `createAnimator` | utility | `@astryxdesign/core/animator` | — | Animates one element with the motion Astryx's own components use, without React. `animate` springs an element to new values on the state-cha |
| `createPanGesture` | utility | `@astryxdesign/core/gestures` | — | Reports a drag on an element as values, without React, for a surface the product moves itself: a card that follows the finger, a drawer pull |
