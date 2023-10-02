import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import type { EditViewProps } from '../../../types'

import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import NotFound from '../../../NotFound'
import { CustomCollectionComponent } from './CustomComponent'
import { collectionCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../../Unauthorized'))

export const CollectionRoutes: React.FC<EditViewProps> = (props) => {
  if ('collection' in props) {
    const { collection, permissions } = props

    const match = useRouteMatch()

    const {
      routes: { admin: adminRoute },
    } = useConfig()

    const { user } = useAuth()

    return (
      <Switch>
        <Route
          exact
          key={`${collection.slug}-versions`}
          path={`${adminRoute}/collections/${collection.slug}/:id/versions`}
        >
          {permissions?.readVersions?.permission ? (
            <CustomCollectionComponent view="Versions" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
        <Route
          exact
          key={`${collection.slug}-api`}
          path={`${adminRoute}/collections/${collection.slug}/:id/api`}
        >
          {permissions?.read ? (
            <CustomCollectionComponent view="API" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
        <Route
          exact
          key={`${collection.slug}-view-version`}
          path={`${adminRoute}/collections/${collection.slug}/:id/versions/:versionID`}
        >
          {permissions?.readVersions?.permission ? (
            <CustomCollectionComponent view="Version" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
        {collectionCustomRoutes({
          collection,
          match,
          permissions,
          user,
        })}
        <Route
          exact
          key={`${collection.slug}-view`}
          path={`${adminRoute}/collections/${collection.slug}/:id`}
        >
          <CustomCollectionComponent view="Default" {...props} />
        </Route>
        <Route path={`${match.url}*`}>
          <NotFound marginTop="large" />
        </Route>
      </Switch>
    )
  }
}
