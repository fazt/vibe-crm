---
name: my-commit
description: Se ejecuta cada vez que se hace un commit.
---

Al pedir el usuario un commit con este skill

se realizan lo siguientes cambios:

1. se actualiza la version del paquete en el package.json usando semantic versioning.

2. se actualiza el changelog en el archivo CHANGELOG.md

3. y hace un git push en la rama actual

### consideraciones

- No coloques a cursor o cursoragent como coautor en el commit

