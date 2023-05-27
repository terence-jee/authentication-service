// import { CssRoles } from '../temp-entities/css-roles';
// export function getPrimaryRole(userRoleNames: string[]) {
//   const userRoles = CssRoles.AllValues.filter((r) => userRoleNames && userRoleNames.includes(r.code));
//   const userRolesByPriority = userRoles.sort((a, b) => a.priority - b.priority);
//   return userRolesByPriority[0];
// }
export function replaceAll(originalString, findText, replaceText) {
    let newString = originalString;
    if (originalString.indexOf(findText) > -1) {
        //need to do a replaceAll
        newString = originalString.split(findText).join(replaceText);
    }
    return newString;
}
//# sourceMappingURL=utils.js.map