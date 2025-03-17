const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем существующие роли
    const existingRoles = await queryInterface.sequelize.query(
      'SELECT name FROM roles',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingRoleNames = existingRoles.map(role => role.name);

    // Создаем только отсутствующие роли
    const rolesToCreate = [
      { name: 'super_admin' },
      { name: 'admin' },
      { name: 'operator' }
    ].filter(role => !existingRoleNames.includes(role.name))
    .map(role => ({
      ...role,
      created_at: new Date(),
      updated_at: new Date()
    }));

    if (rolesToCreate.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToCreate);
    }

    // Проверяем существующие разрешения
    const existingPermissions = await queryInterface.sequelize.query(
      'SELECT name FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingPermissionNames = existingPermissions.map(perm => perm.name);

    // Создаем только отсутствующие разрешения
    const permissionsToCreate = [
      { name: 'manage_users', description: 'Create and manage users' },
      { name: 'manage_roles', description: 'Manage user roles' },
      { name: 'manage_commands', description: 'Create and edit bot commands' },
      { name: 'manage_dialogs', description: 'Create and edit dialogs' },
      { name: 'view_statistics', description: 'View bot statistics' },
      { name: 'export_data', description: 'Export data to files' },
      { name: 'manage_settings', description: 'Manage bot settings' },
      { name: 'chat_access', description: 'Access to chat with users' },
      { name: 'direct_chat', description: 'Enable/disable direct chat' }
    ].filter(perm => !existingPermissionNames.includes(perm.name))
    .map(perm => ({
      ...perm,
      created_at: new Date(),
      updated_at: new Date()
    }));

    if (permissionsToCreate.length > 0) {
      await queryInterface.bulkInsert('permissions', permissionsToCreate);
    }

    // Получаем ID всех ролей и разрешений
    const [roles, perms] = await Promise.all([
      queryInterface.sequelize.query('SELECT id, name FROM roles'),
      queryInterface.sequelize.query('SELECT id, name FROM permissions')
    ]);

    const rolesMap = roles[0].reduce((acc, role) => ({ ...acc, [role.name]: role.id }), {});
    const permsMap = perms[0].reduce((acc, perm) => ({ ...acc, [perm.name]: perm.id }), {});

    // Проверяем существующие связи роль-разрешение
    const existingRolePermissions = await queryInterface.sequelize.query(
      'SELECT role_id, permission_id FROM role_permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Создаем массив новых связей
    const rolePermissions = [
      // Super Admin получает все разрешения
      ...Object.values(permsMap).map(permId => ({
        role_id: rolesMap.super_admin,
        permission_id: permId,
        created_at: new Date()
      })),
      
      // Admin получает все кроме управления пользователями и ролями
      ...Object.entries(permsMap)
        .filter(([name]) => !['manage_users', 'manage_roles'].includes(name))
        .map(([, id]) => ({
          role_id: rolesMap.admin,
          permission_id: id,
          created_at: new Date()
        })),
      
      // Operator получает только базовые разрешения
      ...[permsMap.chat_access, permsMap.view_statistics].map(permId => ({
        role_id: rolesMap.operator,
        permission_id: permId,
        created_at: new Date()
      }))
    ].filter(rp => !existingRolePermissions.some(
      erp => erp.role_id === rp.role_id && erp.permission_id === rp.permission_id
    ));

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions);
    }

    // Проверяем существование супер-админа
    const existingAdmin = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE username = ?',
      {
        replacements: ['admin'],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (existingAdmin.length === 0) {
      const password = await bcrypt.hash('admin', 10);
      await queryInterface.bulkInsert('users', [{
        username: 'admin',
        password: password,
        email: 'admin@example.com',
        role_id: rolesMap.super_admin,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
}; 