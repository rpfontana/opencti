import React, { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';
import { graphql } from 'react-relay';
import { DraftRelationshipsLines_data$data } from '@components/drafts/__generated__/DraftRelationshipsLines_data.graphql';
import {
  DraftRelationshipsLinesPaginationQuery,
  DraftRelationshipsLinesPaginationQuery$variables,
} from '@components/drafts/__generated__/DraftRelationshipsLinesPaginationQuery.graphql';
import useAuth from '../../../utils/hooks/useAuth';
import { usePaginationLocalStorage } from '../../../utils/hooks/useLocalStorage';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import { useBuildEntityTypeBasedFilterContext, emptyFilterGroup } from '../../../utils/filters/filtersUtils';
import { UsePreloadedPaginationFragment } from '../../../utils/hooks/usePreloadedPaginationFragment';
import DataTable from '../../../components/dataGrid/DataTable';
import { DataTableProps } from '../../../components/dataGrid/dataTableTypes';
import ItemEntityType from '../../../components/ItemEntityType';
import { computeLink } from '../../../utils/Entity';

const draftRelationshipsLineFragment = graphql`
    fragment DraftRelationships_node on StixCoreRelationship {
        id
        standard_id
        entity_type
        parent_types
        relationship_type
        confidence
        start_time
        stop_time
        description
        fromRole
        toRole
        created_at
        updated_at
        is_inferred
        draftVersion {
            draft_operation
        }
        createdBy {
            ... on Identity {
                name
            }
        }
        objectMarking {
            id
            definition
            x_opencti_order
            x_opencti_color
        }
        objectLabel {
            id
            value
            color
        }
        createdBy {
            ... on Identity {
                id
                name
                entity_type
            }
        }
        creators {
            id
            name
        }
        objectMarking {
            id
            definition
            x_opencti_order
            x_opencti_color
        }
        from {
            ... on BasicObject {
                id
                entity_type
                parent_types
            }
            ... on BasicRelationship {
                id
                entity_type
                parent_types
            }
            ... on StixCoreObject {
                created_at
                representative {
                    main
                }
            }
            ... on StixCoreRelationship {
                created_at
                start_time
                stop_time
                created
                representative {
                    main
                }
            }
        }
        to {
            ... on BasicObject {
                id
                entity_type
                parent_types
            }
            ... on BasicRelationship {
                id
                entity_type
                parent_types
            }
            ... on StixCoreObject {
                created_at
                representative {
                    main
                }
            }
            ... on StixCoreRelationship {
                created_at
                start_time
                stop_time
                created
                representative {
                    main
                }
            }
        }
    }
`;

const draftRelationshipsLinesQuery = graphql`
    query DraftRelationshipsLinesPaginationQuery(
        $draftId: String!
        $types: [String]
        $search: String
        $count: Int!
        $cursor: ID
        $orderBy: StixRelationshipsOrdering
        $orderMode: OrderingMode
        $filters: FilterGroup
    ) {
        ...DraftRelationshipsLines_data
        @arguments(
            draftId: $draftId
            types: $types
            search: $search
            count: $count
            cursor: $cursor
            orderBy: $orderBy
            orderMode: $orderMode
            filters: $filters
        )
    }
`;

export const draftRelationshipsLinesFragment = graphql`
    fragment DraftRelationshipsLines_data on Query
    @argumentDefinitions(
        draftId: { type: "String!" }
        types: { type: "[String]" }
        search: { type: "String" }
        count: { type: "Int", defaultValue: 25 }
        cursor: { type: "ID" }
        orderBy: { type: "StixRelationshipsOrdering", defaultValue: created }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "FilterGroup" }
    )
    @refetchable(queryName: "DraftRelationshipsLinesRefetchQuery") {
        draftWorkspaceRelationships(
            draftId: $draftId
            types: $types
            search: $search
            first: $count
            after: $cursor
            orderBy: $orderBy
            orderMode: $orderMode
            filters: $filters
        ) @connection(key: "Pagination_draftWorkspaceRelationships") {
            edges {
                node {
                    id
                    ...DraftRelationships_node
                }
            }
            pageInfo {
                endCursor
                hasNextPage
                globalCount
            }
        }
    }
`;

const LOCAL_STORAGE_KEY = 'draft_relationships';

interface DraftRelationshipsProps {
  isReadOnly: boolean;
}

const DraftRelationships : FunctionComponent<DraftRelationshipsProps> = ({ isReadOnly }) => {
  const { draftId } = useParams() as { draftId: string };
  const {
    platformModuleHelpers: { isRuntimeFieldEnable },
  } = useAuth();
  const initialValues = {
    filters: {
      ...emptyFilterGroup,
    },
    searchTerm: '',
    sortBy: 'created_at',
    orderAsc: false,
    openExports: false,
    redirectionMode: 'overview',
    draftId,
  };

  const {
    viewStorage,
    paginationOptions,
    helpers: storageHelpers,
  } = usePaginationLocalStorage<DraftRelationshipsLinesPaginationQuery$variables>(LOCAL_STORAGE_KEY, initialValues);
  const {
    filters,
  } = viewStorage;

  const contextFilters = useBuildEntityTypeBasedFilterContext('stix-core-relationship', filters);
  const relevantDraftOperationFilter = { key: 'draft_change.draft_operation', values: ['create', 'update', 'delete'], operator: 'eq', mode: 'or' };
  const toolbarFilters = { ...contextFilters, filters: [...contextFilters.filters, relevantDraftOperationFilter] };
  const queryPaginationOptions = {
    ...paginationOptions,
    draftId,
    filters: contextFilters,
  } as unknown as DraftRelationshipsLinesPaginationQuery$variables;

  const queryRef = useQueryLoading<DraftRelationshipsLinesPaginationQuery>(
    draftRelationshipsLinesQuery,
    queryPaginationOptions,
  );

  const isRuntimeSort = isRuntimeFieldEnable() ?? false;
  const dataColumns: DataTableProps['dataColumns'] = {
    draftVersion: {
      isSortable: false,
      percentWidth: 8,
    },
    fromType: {
      id: 'fromType',
      label: 'From type',
      percentWidth: 10,
      isSortable: false,
      render: (node) => (
        <ItemEntityType inList showIcon entityType={node.from?.entity_type} isRestricted={!node.from} />
      ),
    },
    fromName: { percentWidth: 13 },
    relationship_type: { percentWidth: 10 },
    toType: {
      id: 'toType',
      label: 'To type',
      percentWidth: 10,
      isSortable: false,
      render: (node) => (
        <ItemEntityType inList showIcon entityType={node.to?.entity_type} isRestricted={!node.to} />
      ),
    },
    toName: { percentWidth: 13 },
    createdBy: { percentWidth: 8, isSortable: isRuntimeSort },
    creator: { percentWidth: 8, isSortable: isRuntimeSort },
    created_at: { percentWidth: 12 },
    objectMarking: { percentWidth: 8, isSortable: isRuntimeSort },
  };

  const preloadedPaginationProps = {
    linesQuery: draftRelationshipsLinesQuery,
    linesFragment: draftRelationshipsLinesFragment,
    queryRef,
    nodePath: ['draftWorkspaceRelationships', 'pageInfo', 'globalCount'],
    setNumberOfElements: storageHelpers.handleSetNumberOfElements,
  } as UsePreloadedPaginationFragment<DraftRelationshipsLinesPaginationQuery>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRedirectionLink = (stixRelationship: any) => {
    if (isReadOnly) {
      const isUpdatedEntity = stixRelationship.draftVersion?.draft_operation === 'update' || stixRelationship.draftVersion?.draft_operation === 'update_linked';
      return isUpdatedEntity ? `/dashboard/id/${stixRelationship.id}` : `/dashboard/id/${stixRelationship.standard_id}`;
    }
    return computeLink(stixRelationship);
  };

  return (
    <span data-testid="draft-relationships-page">
      {queryRef && (
      <DataTable
        dataColumns={dataColumns}
        resolvePath={(data: DraftRelationshipsLines_data$data) => data.draftWorkspaceRelationships?.edges?.map((n) => n?.node)}
        storageKey={LOCAL_STORAGE_KEY}
        initialValues={initialValues}
        useComputeLink={getRedirectionLink}
        toolbarFilters={toolbarFilters}
        preloadedPaginationProps={preloadedPaginationProps}
        lineFragment={draftRelationshipsLineFragment}
        entityTypes={['stix-core-relationship']}
        removeFromDraftEnabled
      />
      )}
    </span>
  );
};

export default DraftRelationships;
