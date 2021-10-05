# AvalancheJS - ESlint Documentation

## Overview

`yarn lint`

to run the linter against the repo.

### Common warnings

* [Generic Object Injection Sink](https://github.com/nodesecurity/eslint-plugin-security/blob/master/docs/the-dangers-of-square-bracket-notation.md)
* Function Call Object Injection Sink
* Variable Assigned to Object Injection Sink

To resolve these warnings,

```js
  example[value]
```

you will need to wrap the variable name inside "`" literals;

```js
   example[`${value}`]
```

or

```js
   example[value.toString()]
```

#### Helpers

If you are running VSCode, you can use these snippets to automate the repetive tasks.

* highlight the variable that ESlint warns about
* press shift+`

To get this to work you'll need to add this code snippet

```
{
  "generic object injection": {
    "prefix": ["detect", "`"],
    "body": ["`${${TM_SELECTED_TEXT}}`"],
    "description": "Wrap in `` literals to remove ESling warning"
  }
}

```

you then need to append this to  `keybindings.json`

```
  {
    "key": "shift+`",
    "command": "editor.action.insertSnippet",
    "args": { "name": "generic object injection" }
  }
```

the name `generic object injection` can be changed , but just has to match the keybinding argument.

