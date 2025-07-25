/**
 * Dynamic Entity Manager
 * Core engine for creating and managing dynamic entities with Greek compliance
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DynamicEntity,
  DynamicField,
  EntityLayout,
  FieldType,
  EntityCategory,
  CustomizationLevel,
  BusinessRule,
  EntityRelationship,
  GreekComplianceConfig,
  EntityPermissions,
  FieldValidation,
  GreekFieldValidation,
  LayoutType,
  ValidationRule
} from '../types';

export interface EntityDefinition {
  name: string;
  pluralName: string;
  labelSingular: string;
  labelPlural: string;
  labelSingularGreek?: string;
  labelPluralGreek?: string;
  icon: string;
  color: string;
  description?: string;
  descriptionGreek?: string;
  module: string;
  category: EntityCategory;
  customizationLevel: CustomizationLevel;
  greekCompliance?: Partial<GreekComplianceConfig>;
  permissions?: Partial<EntityPermissions>;
}

export interface FieldDefinition {
  name: string;
  label: string;
  labelGreek?: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  searchable?: boolean;
  defaultValue?: any;
  validation?: Partial<FieldValidation>;
  greekValidation?: Partial<GreekFieldValidation>;
  options?: Array<{ value: string; label: string; labelGreek?: string }>;
  description?: string;
  descriptionGreek?: string;
  helpText?: string;
  helpTextGreek?: string;
}

export interface EntityCreationResult {
  entity: DynamicEntity;
  databaseSchema: string;
  apiEndpoints: string[];
  uiComponents: string[];
  validationErrors: string[];
  warnings: string[];
}

export interface FieldCreationResult {
  field: DynamicField;
  validationErrors: string[];
  warnings: string[];
  requiresMigration: boolean;
  migrationScript?: string;
}

export class DynamicEntityManager {
  private entities: Map<string, DynamicEntity> = new Map();
  private readonly reservedNames = new Set([
    'user', 'company', 'role', 'permission', 'audit_log', 'system',
    'admin', 'config', 'session', 'token', 'cache', 'queue', 'job'
  ]);

  /**
   * Create a new dynamic entity with validation and Greek compliance
   */
  async createEntity(definition: EntityDefinition): Promise<EntityCreationResult> {
    console.log(`Creating dynamic entity: ${definition.name}`);
    
    const validationErrors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate entity definition
    const entityValidation = await this.validateEntityDefinition(definition);
    if (entityValidation.errors.length > 0) {
      validationErrors.push(...entityValidation.errors);
    }
    warnings.push(...entityValidation.warnings);

    if (validationErrors.length > 0) {
      throw new Error(`Entity validation failed: ${validationErrors.join(', ')}`);
    }

    // 2. Create entity object
    const entity: DynamicEntity = {
      id: uuidv4(),
      name: definition.name,
      pluralName: definition.pluralName,
      labelSingular: definition.labelSingular,
      labelPlural: definition.labelPlural,
      labelSingularGreek: definition.labelSingularGreek,
      labelPluralGreek: definition.labelPluralGreek,
      icon: definition.icon,
      color: definition.color,
      description: definition.description,
      descriptionGreek: definition.descriptionGreek,
      module: definition.module,
      category: definition.category,
      customizationLevel: definition.customizationLevel,

      // Initialize empty collections
      fields: [],
      relationships: [],
      indexes: [],
      constraints: [],
      layouts: [],
      workflows: [],
      validationRules: [],
      businessRules: [],

      // Default configurations
      defaultLayout: 'default',
      listViewConfig: this.createDefaultListViewConfig(),
      searchConfig: this.createDefaultSearchConfig(),

      // Greek compliance
      greekCompliance: this.createGreekComplianceConfig(definition.greekCompliance),
      aadeIntegration: definition.greekCompliance?.aadeReporting || false,
      taxRelevant: definition.greekCompliance?.taxRelevant || false,
      gdprRelevant: definition.greekCompliance?.personalData || false,

      // Permissions
      permissions: this.createDefaultPermissions(definition.permissions),
      accessControl: {
        companyIsolation: true,
        departmentRestrictions: [],
        roleBasedAccess: true,
        fieldLevelSecurity: true,
        recordLevelSecurity: true,
      },

      // Versioning
      version: '1.0.0',
      createdBy: 'system', // TODO: Get from auth context
      createdAt: new Date(),
      updatedBy: 'system',
      updatedAt: new Date(),
      isActive: true,
      isSystemEntity: false,
    };

    // 3. Add standard fields (id, created_at, updated_at, etc.)
    const standardFields = this.createStandardFields();
    entity.fields.push(...standardFields);

    // 4. Create default layouts
    const defaultLayouts = await this.createDefaultLayouts(entity);
    entity.layouts.push(...defaultLayouts);

    // 5. Generate database schema
    const databaseSchema = this.generateDatabaseSchema(entity);

    // 6. Generate API endpoints
    const apiEndpoints = this.generateAPIEndpoints(entity);

    // 7. Generate UI components
    const uiComponents = this.generateUIComponents(entity);

    // 8. Store entity
    this.entities.set(entity.id, entity);

    console.log(`Entity created successfully: ${entity.name} (${entity.id})`);

    return {
      entity,
      databaseSchema,
      apiEndpoints,
      uiComponents,
      validationErrors,
      warnings,
    };
  }

  /**
   * Add a custom field to an existing entity
   */
  async addField(entityId: string, fieldDefinition: FieldDefinition): Promise<FieldCreationResult> {
    console.log(`Adding field ${fieldDefinition.name} to entity ${entityId}`);

    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    const validationErrors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate field definition
    const fieldValidation = await this.validateFieldDefinition(fieldDefinition, entity);
    if (fieldValidation.errors.length > 0) {
      validationErrors.push(...fieldValidation.errors);
    }
    warnings.push(...fieldValidation.warnings);

    if (validationErrors.length > 0) {
      throw new Error(`Field validation failed: ${validationErrors.join(', ')}`);
    }

    // 2. Create field object
    const field: DynamicField = {
      id: uuidv4(),
      name: fieldDefinition.name,
      label: fieldDefinition.label,
      labelGreek: fieldDefinition.labelGreek,
      type: fieldDefinition.type,
      description: fieldDefinition.description,
      descriptionGreek: fieldDefinition.descriptionGreek,
      helpText: fieldDefinition.helpText,
      helpTextGreek: fieldDefinition.helpTextGreek,

      // Configuration
      required: fieldDefinition.required || false,
      unique: fieldDefinition.unique || false,
      indexed: fieldDefinition.indexed || false,
      searchable: fieldDefinition.searchable ?? true,
      sortable: this.isFieldSortable(fieldDefinition.type),
      filterable: this.isFieldFilterable(fieldDefinition.type),
      exportable: true,

      // Data properties
      defaultValue: fieldDefinition.defaultValue,
      options: fieldDefinition.options?.map(opt => ({
        ...opt,
        isDefault: false,
        isActive: true,
      })),

      // Validation
      validation: this.createFieldValidation(fieldDefinition.validation),
      greekValidation: fieldDefinition.greekValidation,

      // Display properties
      displayOrder: entity.fields.length + 1,
      gridColumn: this.shouldShowInGrid(fieldDefinition.type),
      detailSection: 'general',
      isInlineEditable: this.isInlineEditable(fieldDefinition.type),
      showInList: this.shouldShowInList(fieldDefinition.type),
      showInDetail: true,
      showInSearch: fieldDefinition.searchable ?? true,

      // Permissions
      permissions: {
        create: ['admin', 'manager', 'user'],
        read: ['admin', 'manager', 'user'],
        update: ['admin', 'manager'],
        delete: ['admin'],
      },

      // Versioning
      version: '1.0.0',
      createdBy: 'system',
      createdAt: new Date(),
      isActive: true,
    };

    // 3. Add Greek-specific configuration
    if (this.isGreekSpecificField(fieldDefinition.type)) {
      this.configureGreekField(field);
    }

    // 4. Add field to entity
    entity.fields.push(field);
    entity.updatedAt = new Date();

    // 5. Check if migration is required
    const requiresMigration = !this.isVirtualField(field.type);
    const migrationScript = requiresMigration ? this.generateFieldMigration(entity, field) : undefined;

    // 6. Update layouts to include new field
    await this.updateLayoutsWithNewField(entity, field);

    console.log(`Field added successfully: ${field.name} (${field.id})`);

    return {
      field,
      validationErrors,
      warnings,
      requiresMigration,
      migrationScript,
    };
  }

  /**
   * Create a layout for an entity
   */
  async createLayout(
    entityId: string,
    layoutType: LayoutType,
    name: string,
    nameGreek?: string
  ): Promise<EntityLayout> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    const layout: EntityLayout = {
      id: uuidv4(),
      entityId,
      name,
      nameGreek,
      type: layoutType,
      isDefault: entity.layouts.length === 0,
      isGreekOptimized: !!nameGreek,

      configuration: {
        columns: this.getDefaultColumnsForLayoutType(layoutType),
        spacing: 'normal',
        showSectionHeaders: true,
        showFieldLabels: true,
        enableDragAndDrop: true,
        enableInlineEditing: layoutType === 'list',
        theme: 'light',
      },

      sections: await this.createLayoutSections(entity, layoutType),
      permissions: [{
        role: 'admin',
        canView: true,
        canEdit: true,
        canCustomize: true,
      }],
      responsiveSettings: this.createResponsiveSettings(layoutType),

      customSettings: {},
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };

    entity.layouts.push(layout);
    return layout;
  }

  /**
   * Validate entity definition
   */
  private async validateEntityDefinition(definition: EntityDefinition) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Name validation
    if (!definition.name || definition.name.length < 2) {
      errors.push('Entity name must be at least 2 characters long');
    }

    if (!/^[a-z][a-z0-9_]*$/.test(definition.name)) {
      errors.push('Entity name must start with a letter and contain only lowercase letters, numbers, and underscores');
    }

    if (this.reservedNames.has(definition.name)) {
      errors.push(`Entity name '${definition.name}' is reserved`);
    }

    // Check for existing entity with same name
    const existingEntity = Array.from(this.entities.values()).find(e => e.name === definition.name);
    if (existingEntity) {
      errors.push(`Entity with name '${definition.name}' already exists`);
    }

    // Label validation
    if (!definition.labelSingular || definition.labelSingular.length < 2) {
      errors.push('Singular label must be at least 2 characters long');
    }

    if (!definition.labelPlural || definition.labelPlural.length < 2) {
      errors.push('Plural label must be at least 2 characters long');
    }

    // Greek compliance validation
    if (definition.greekCompliance?.aadeReporting && !definition.greekCompliance?.taxRelevant) {
      warnings.push('AADE reporting is enabled but entity is not marked as tax relevant');
    }

    return { errors, warnings };
  }

  /**
   * Validate field definition
   */
  private async validateFieldDefinition(definition: FieldDefinition, entity: DynamicEntity) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Name validation
    if (!definition.name || definition.name.length < 2) {
      errors.push('Field name must be at least 2 characters long');
    }

    if (!/^[a-z][a-z0-9_]*$/.test(definition.name)) {
      errors.push('Field name must start with a letter and contain only lowercase letters, numbers, and underscores');
    }

    // Check for existing field with same name
    const existingField = entity.fields.find(f => f.name === definition.name);
    if (existingField) {
      errors.push(`Field with name '${definition.name}' already exists in entity`);
    }

    // Type-specific validation
    if (definition.type === 'lookup' && !definition.options?.length) {
      errors.push('Lookup fields must have target entity specified in options');
    }

    if (definition.type === 'dropdown' && (!definition.options || definition.options.length === 0)) {
      errors.push('Dropdown fields must have at least one option');
    }

    // Greek field validation
    if (this.isGreekSpecificField(definition.type)) {
      if (!entity.greekCompliance.aadeReporting && definition.type === 'greek_afm') {
        warnings.push('AFM field added but AADE reporting is not enabled for this entity');
      }
    }

    return { errors, warnings };
  }

  /**
   * Create standard system fields for all entities
   */
  private createStandardFields(): DynamicField[] {
    const fields: DynamicField[] = [
      {
        id: uuidv4(),
        name: 'id',
        label: 'ID',
        labelGreek: 'Αναγνωριστικό',
        type: 'text',
        required: true,
        unique: true,
        indexed: true,
        searchable: true,
        sortable: true,
        filterable: true,
        exportable: true,
        displayOrder: 0,
        gridColumn: false,
        detailSection: 'system',
        isInlineEditable: false,
        showInList: false,
        showInDetail: true,
        showInSearch: false,
        validation: { rules: [] },
        permissions: {
          create: [],
          read: ['admin', 'manager', 'user'],
          update: [],
          delete: [],
        },
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'created_at',
        label: 'Created At',
        labelGreek: 'Ημερομηνία Δημιουργίας',
        type: 'datetime',
        required: true,
        unique: false,
        indexed: true,
        searchable: false,
        sortable: true,
        filterable: true,
        exportable: true,
        displayOrder: 998,
        gridColumn: true,
        detailSection: 'system',
        isInlineEditable: false,
        showInList: true,
        showInDetail: true,
        showInSearch: false,
        validation: { rules: [] },
        permissions: {
          create: [],
          read: ['admin', 'manager', 'user'],
          update: [],
          delete: [],
        },
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'updated_at',
        label: 'Updated At',
        labelGreek: 'Ημερομηνία Ενημέρωσης',
        type: 'datetime',
        required: true,
        unique: false,
        indexed: true,
        searchable: false,
        sortable: true,
        filterable: true,
        exportable: true,
        displayOrder: 999,
        gridColumn: true,
        detailSection: 'system',
        isInlineEditable: false,
        showInList: true,
        showInDetail: true,
        showInSearch: false,
        validation: { rules: [] },
        permissions: {
          create: [],
          read: ['admin', 'manager', 'user'],
          update: [],
          delete: [],
        },
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        isActive: true,
      },
    ];

    return fields;
  }

  /**
   * Helper methods for field type checking
   */
  private isFieldSortable(type: FieldType): boolean {
    const sortableTypes: FieldType[] = [
      'text', 'number', 'decimal', 'currency', 'date', 'datetime', 'time',
      'dropdown', 'boolean', 'greek_afm', 'greek_phone'
    ];
    return sortableTypes.includes(type);
  }

  private isFieldFilterable(type: FieldType): boolean {
    const nonFilterableTypes: FieldType[] = ['richtext', 'markdown', 'file', 'image', 'signature'];
    return !nonFilterableTypes.includes(type);
  }

  private shouldShowInGrid(type: FieldType): boolean {
    const gridTypes: FieldType[] = [
      'text', 'number', 'currency', 'date', 'dropdown', 'boolean', 'email', 'phone'
    ];
    return gridTypes.includes(type);
  }

  private shouldShowInList(type: FieldType): boolean {
    const listTypes: FieldType[] = [
      'text', 'number', 'currency', 'date', 'dropdown', 'boolean', 'email', 'phone'
    ];
    return listTypes.includes(type);
  }

  private isInlineEditable(type: FieldType): boolean {
    const inlineEditableTypes: FieldType[] = [
      'text', 'number', 'currency', 'dropdown', 'boolean', 'checkbox'
    ];
    return inlineEditableTypes.includes(type);
  }

  private isGreekSpecificField(type: FieldType): boolean {
    return type.startsWith('greek_');
  }

  private isVirtualField(type: FieldType): boolean {
    return ['calculated', 'formula', 'aggregation'].includes(type);
  }

  private configureGreekField(field: DynamicField): void {
    // Configure Greek-specific field properties
    if (field.type === 'greek_afm') {
      field.pattern = '^[0-9]{9}$';
      field.validation.rules.push({
        type: 'greek_specific',
        message: 'Invalid Greek AFM format',
        messageGreek: 'Μη έγκυρος ΑΦΜ',
      });
    }
    // Add more Greek field configurations as needed
  }

  /**
   * Create default configurations
   */
  private createDefaultListViewConfig() {
    return {
      defaultColumns: ['id', 'created_at', 'updated_at'],
      sortableColumns: ['created_at', 'updated_at'],
      filterableColumns: ['created_at', 'updated_at'],
      searchableColumns: ['id'],
      defaultSortField: 'created_at',
      defaultSortDirection: 'desc' as const,
      pageSize: 25,
      allowExport: true,
      allowImport: true,
      bulkActions: [
        {
          id: 'delete',
          name: 'Delete',
          nameGreek: 'Διαγραφή',
          icon: 'trash',
          action: 'bulk_delete',
          requiresConfirmation: true,
          permissions: ['admin'],
        },
      ],
    };
  }

  private createDefaultSearchConfig() {
    return {
      searchableFields: ['id'],
      quickSearchFields: ['id'],
      advancedSearchEnabled: true,
      fullTextSearch: false,
      searchOperators: [
        {
          value: 'contains',
          label: 'Contains',
          labelGreek: 'Περιέχει',
          applicableTypes: ['text', 'textarea'] as FieldType[],
        },
        {
          value: 'equals',
          label: 'Equals',
          labelGreek: 'Ισούται',
          applicableTypes: ['text', 'number', 'dropdown'] as FieldType[],
        },
      ],
    };
  }

  private createGreekComplianceConfig(partial?: Partial<GreekComplianceConfig>): GreekComplianceConfig {
    return {
      aadeReporting: partial?.aadeReporting || false,
      taxRelevant: partial?.taxRelevant || false,
      personalData: partial?.personalData || false,
      professionalCertification: partial?.professionalCertification,
      requiredDocuments: partial?.requiredDocuments || [],
      complianceLevel: partial?.complianceLevel || 'basic',
      auditTrail: partial?.auditTrail || true,
      digitalSignature: partial?.digitalSignature || false,
    };
  }

  private createDefaultPermissions(partial?: Partial<EntityPermissions>): EntityPermissions {
    return {
      create: partial?.create || ['admin', 'manager'],
      read: partial?.read || ['admin', 'manager', 'user'],
      update: partial?.update || ['admin', 'manager'],
      delete: partial?.delete || ['admin'],
      export: partial?.export || ['admin', 'manager'],
      import: partial?.import || ['admin'],
      customizeFields: partial?.customizeFields || ['admin'],
      customizeLayouts: partial?.customizeLayouts || ['admin'],
      createWorkflows: partial?.createWorkflows || ['admin'],
    };
  }

  private createFieldValidation(partial?: Partial<FieldValidation>): FieldValidation {
    return {
      rules: partial?.rules || [],
      customValidation: partial?.customValidation,
      errorMessage: partial?.errorMessage,
      errorMessageGreek: partial?.errorMessageGreek,
      asyncValidation: partial?.asyncValidation,
    };
  }

  /**
   * Code generation methods
   */
  private generateDatabaseSchema(entity: DynamicEntity): string {
    // Generate SQL DDL for the entity
    const tableName = `custom_${entity.name}`;
    const columns = entity.fields.map(field => this.generateColumnDefinition(field));
    
    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
  }

  private generateColumnDefinition(field: DynamicField): string {
    const typeMapping: Record<string, string> = {
      'text': 'VARCHAR(255)',
      'textarea': 'TEXT',
      'number': 'INTEGER',
      'decimal': 'DECIMAL(10,2)',
      'currency': 'DECIMAL(15,2)',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'boolean': 'BOOLEAN',
      'email': 'VARCHAR(255)',
      'phone': 'VARCHAR(20)',
      'greek_afm': 'VARCHAR(9)',
      'greek_phone': 'VARCHAR(20)',
    };

    const sqlType = typeMapping[field.type] || 'TEXT';
    const nullable = field.required ? 'NOT NULL' : 'NULL';
    const unique = field.unique ? 'UNIQUE' : '';
    
    return `${field.name} ${sqlType} ${nullable} ${unique}`.trim();
  }

  private generateAPIEndpoints(entity: DynamicEntity): string[] {
    const entityName = entity.name;
    return [
      `GET /api/entities/${entityName}`,
      `POST /api/entities/${entityName}`,
      `GET /api/entities/${entityName}/:id`,
      `PUT /api/entities/${entityName}/:id`,
      `DELETE /api/entities/${entityName}/:id`,
      `GET /api/entities/${entityName}/schema`,
      `POST /api/entities/${entityName}/bulk`,
    ];
  }

  private generateUIComponents(entity: DynamicEntity): string[] {
    const componentName = entity.name.charAt(0).toUpperCase() + entity.name.slice(1);
    return [
      `${componentName}List`,
      `${componentName}Form`,
      `${componentName}Detail`,
      `${componentName}Card`,
      `Dynamic${componentName}Form`,
    ];
  }

  /**
   * Layout generation methods
   */
  private async createDefaultLayouts(entity: DynamicEntity): Promise<EntityLayout[]> {
    const layouts: EntityLayout[] = [];
    
    // Create form layout
    layouts.push(await this.createLayout(entity.id, 'form', 'Default Form', 'Προεπιλεγμένη Φόρμα'));
    
    // Create list layout
    layouts.push(await this.createLayout(entity.id, 'list', 'Default List', 'Προεπιλεγμένη Λίστα'));
    
    // Create detail layout
    layouts.push(await this.createLayout(entity.id, 'detail', 'Default Detail', 'Προεπιλεγμένο Στοιχείο'));

    return layouts;
  }

  private async createLayoutSections(entity: DynamicEntity, layoutType: LayoutType) {
    // Create basic sections based on layout type
    const sections = [
      {
        id: uuidv4(),
        name: 'General',
        nameGreek: 'Γενικά',
        order: 1,
        columns: layoutType === 'form' ? 2 : 1,
        isCollapsible: false,
        isCollapsed: false,
        fields: [],
        customSettings: {},
      },
    ];

    // Add system section for detail layouts
    if (layoutType === 'detail') {
      sections.push({
        id: uuidv4(),
        name: 'System Information',
        nameGreek: 'Πληροφορίες Συστήματος',
        order: 99,
        columns: 2,
        isCollapsible: true,
        isCollapsed: true,
        fields: [],
        customSettings: {},
      });
    }

    return sections;
  }

  private getDefaultColumnsForLayoutType(layoutType: LayoutType): number {
    switch (layoutType) {
      case 'form': return 2;
      case 'detail': return 2;
      case 'list': return 1;
      default: return 1;
    }
  }

  private createResponsiveSettings(layoutType: LayoutType) {
    return {
      mobile: {
        columnsPerRow: 1,
        hideFields: [],
        collapsesSections: ['system'],
      },
      tablet: {
        columnsPerRow: layoutType === 'form' ? 2 : 1,
        hideFields: [],
        collapsesSections: [],
      },
      desktop: {
        columnsPerRow: this.getDefaultColumnsForLayoutType(layoutType),
        hideFields: [],
        collapsesSections: [],
      },
      largeDesktop: {
        columnsPerRow: this.getDefaultColumnsForLayoutType(layoutType),
        hideFields: [],
        collapsesSections: [],
      },
    };
  }

  private async updateLayoutsWithNewField(entity: DynamicEntity, field: DynamicField): Promise<void> {
    // Add field to appropriate layouts
    entity.layouts.forEach(layout => {
      if (layout.type === 'form' || layout.type === 'detail') {
        const generalSection = layout.sections.find(s => s.name === 'General');
        if (generalSection) {
          generalSection.fields.push({
            fieldId: field.id,
            order: generalSection.fields.length + 1,
            isVisible: true,
            isReadonly: false,
            displaySettings: {
              width: 'medium',
              alignment: 'left',
              labelPosition: 'top',
              showBorder: true,
              showBackground: false,
            },
          });
        }
      }
    });
  }

  private generateFieldMigration(entity: DynamicEntity, field: DynamicField): string {
    const tableName = `custom_${entity.name}`;
    const columnDef = this.generateColumnDefinition(field);
    return `ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`;
  }

  /**
   * Public getter methods
   */
  getEntity(id: string): DynamicEntity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): DynamicEntity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesByCategory(category: EntityCategory): DynamicEntity[] {
    return this.getAllEntities().filter(entity => entity.category === category);
  }

  getEntitiesByModule(module: string): DynamicEntity[] {
    return this.getAllEntities().filter(entity => entity.module === module);
  }
} 