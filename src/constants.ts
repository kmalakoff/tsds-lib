// Folder under the package root where the commands link the package to itself.
// npm never installs into it, so a running install cannot unpack through the link.
export const LINK_FOLDER = 'test';
